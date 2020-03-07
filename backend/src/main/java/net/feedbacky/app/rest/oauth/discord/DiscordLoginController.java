package net.feedbacky.app.rest.oauth.discord;

import net.feedbacky.app.exception.types.LoginFailedException;
import net.feedbacky.app.repository.UserRepository;
import net.feedbacky.app.rest.data.user.ConnectedAccount;
import net.feedbacky.app.rest.data.user.User;
import net.feedbacky.app.rest.oauth.AbstractLoginController;
import net.feedbacky.app.rest.oauth.AuthGrant;
import net.feedbacky.app.utils.JwtTokenUtil;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.net.ssl.HttpsURLConnection;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * @author Plajer
 * <p>
 * Created at 01.10.2019
 */
@RestController
public class DiscordLoginController implements AbstractLoginController {

  @Value("${oauth.discord.redirect-uri}") private String redirectUri;
  @Value("${oauth.discord.client-id}") private String clientId;
  @Value("${oauth.discord.client-secret}") private String clientSecret;
  @Autowired private UserRepository userRepository;
  @Autowired private JwtTokenUtil jwtTokenUtil;

  @Override
  @GetMapping("/service/v1/discord")
  public ResponseEntity handle(HttpServletResponse response, HttpServletRequest request, @RequestParam(name = "code") String code) throws IOException {
    //todo dry
    URL url = new URL("https://discordapp.com/api/oauth2/token");
    HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
    conn.setRequestMethod("POST");
    conn.setRequestProperty("User-Agent", "Feedbacky Login Fetcher/1.1");
    conn.setDoOutput(true);

    OutputStream os = conn.getOutputStream();
    os.write(("grant_type=authorization_code&client_id=" + clientId + "&client_secret=" + clientSecret
        + "&redirect_uri=" + URLEncoder.encode(redirectUri, "UTF-8") + "&code=" + code).getBytes(StandardCharsets.UTF_8));
    os.flush();
    os.close();

    int responseCode = conn.getResponseCode();
    if (responseCode != HttpURLConnection.HTTP_OK) {
      throw new LoginFailedException("Failed to log in via Discord! Code: " + responseCode + ". Message: " + conn.getResponseMessage());
    }

    AuthGrant grant = new ObjectMapper().readValue(getResponse(conn.getInputStream()), AuthGrant.class);
    User user = connectAsDiscordUser(grant);
    conn.disconnect();

    Map<String, Object> json = new HashMap<>();
    String jwtToken = jwtTokenUtil.generateToken(user.getEmail());
    json.put("token", jwtToken);
    json.put("user", user.convertToDto().exposeSensitiveData(true));
    return ResponseEntity.ok().body(json);
  }

  private User connectAsDiscordUser(AuthGrant grant) throws IOException {
    URL url = new URL("https://discordapp.com/api/users/@me");
    HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
    conn.setRequestProperty("User-Agent", "Feedbacky Login Finalizer/1.1");
    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
    conn.setRequestProperty("Authorization", "Bearer " + grant.getAccessToken());
    conn.setDoOutput(true);

    DiscordUser discordUser = new ObjectMapper().readValue(getResponse(conn.getInputStream()), DiscordUser.class);
    if (discordUser.getEmail() == null) {
      throw new LoginFailedException("Email for this Discord user is not valid.");
    }
    if(!discordUser.getVerified()) {
      throw new LoginFailedException("Email for this Discord user is not verified.");
    }

    Optional<User> optional = userRepository.findByEmail(discordUser.getEmail());
    if (!optional.isPresent()) {
      optional = Optional.of(new User());
      User user = optional.get();
      user.setEmail(discordUser.getEmail());
      user.setAvatar(discordUser.getAvatar());
      user.setUsername(discordUser.getUsername());
      Set<ConnectedAccount> accounts = new HashSet<>();
      accounts.add(generateConnectedAccount(discordUser, user));
      user.setConnectedAccounts(accounts);
      userRepository.save(user);
    } else {
      User user = optional.get();
      if (user.getConnectedAccounts().stream().noneMatch(acc -> acc.getType() == ConnectedAccount.AccountType.DISCORD)) {
        Set<ConnectedAccount> accounts = new HashSet<>(user.getConnectedAccounts());
        accounts.add(generateConnectedAccount(discordUser, user));
        user.setConnectedAccounts(accounts);
        userRepository.save(user);
      }
      updateAvatarIfNeeded(user, discordUser);
    }
    conn.disconnect();
    return optional.get();
  }

  private ConnectedAccount generateConnectedAccount(DiscordUser discordUser, User user) {
    ConnectedAccount account = new ConnectedAccount();
    account.setUser(user);
    account.setType(ConnectedAccount.AccountType.DISCORD);
    Map<String, String> data = new HashMap<>();
    data.put("SNOWFLAKE", String.valueOf(discordUser.getId()));
    data.put("USERNAME", discordUser.getUsername());
    data.put("DISCRIMINATOR", discordUser.getDiscriminator());
    data.put("AVATAR", discordUser.getAvatar());
    data.put("EMAIL", discordUser.getEmail());
    try {
      account.setData(new ObjectMapper().writeValueAsString(data));
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
    return account;
  }

  /**
   * Updates discord avatar in case previous one don't work anymore
   */
  private void updateAvatarIfNeeded(User user, DiscordUser discordUser) {
    if(!user.getAvatar().startsWith("https://cdn.discordapp.com/avatars/")) {
      return;
    }
    user.setAvatar(discordUser.getAvatar());
  }

}
