package net.feedbacky.app.rest.data.idea.attachment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.feedbacky.app.rest.data.idea.Idea;
import net.feedbacky.app.rest.data.idea.dto.attachment.FetchAttachmentDto;

import org.modelmapper.ModelMapper;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import java.io.Serializable;

/**
 * @author Plajer
 * <p>
 * Created at 20.12.2019
 */
@Entity
@Table(name = "ideas_attachments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Attachment implements Serializable {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String url;
  @ManyToOne(fetch = FetchType.LAZY)
  private Idea idea;

  public FetchAttachmentDto convertToDto() {
    return new ModelMapper().map(this, FetchAttachmentDto.class);
  }

}
