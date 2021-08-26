import styled from "@emotion/styled";
import {renderLogIn} from "components/commons/navbar-commons";
import {AppContext, BoardContext} from "context";
import React, {useContext} from 'react';
import {FaRegComment, FaRegListAlt, FaRegMap} from "react-icons/all";
import {UiContainer} from "ui/grid";
import {UiNavbar, UiNavbarBrand, UiNavbarOption, UiNavbarSelectedOption} from "ui/navbar";

const SelectedRoute = styled(UiNavbarSelectedOption)`
  @media(max-width: 576px) {
    padding-bottom: 12px;
  }
`;

const BoardNavbar = ({selectedNode}) => {
    const context = useContext(AppContext);
    const {data, onNotLoggedClick} = useContext(BoardContext);
    const FeedbackComponent = selectedNode === "feedback" ? SelectedRoute : UiNavbarOption;
    const RoadmapComponent = selectedNode === "roadmap" ? SelectedRoute : UiNavbarOption;
    const ChangelogComponent = selectedNode === "changelog" ? SelectedRoute : UiNavbarOption;

    return <UiNavbar>
        <UiContainer className={"d-sm-flex d-block"}>
            <UiNavbarBrand theme={context.getTheme().toString()} to={{pathname: "/me", state: {_boardData: data}}}>
                <img className={"mr-2"} src={data.logo} height={30} width={30} alt={"Board Logo"}/>
                <span className={"align-bottom"}>{data.name}</span>
            </UiNavbarBrand>
            {renderLogIn(onNotLoggedClick, context, data)}
            <div className={"d-sm-flex d-block my-sm-0 my-2 order-sm-1 order-2"} style={{fontWeight: "500"}}>
                <FeedbackComponent to={{pathname: "/b/" + data.discriminator, state: {_boardData: data}}}
                                   theme={context.getTheme()} border={selectedNode === "feedback" ? context.getTheme().setAlpha(.75) : undefined} aria-label={"Feedback"}>
                    <FaRegComment className={"mr-sm-2 mr-0 mx-sm-0 mx-1"}/>
                    <span className={"d-inline-block align-middle"}>Feedback</span>
                </FeedbackComponent>
                {data.roadmapEnabled &&
                <RoadmapComponent to={{pathname: "/b/" + data.discriminator + "/roadmap", state: {_boardData: data}}}
                                  theme={context.getTheme()} border={selectedNode === "roadmap" ? context.getTheme().setAlpha(.75) : undefined} aria-label={"Roadmap"}>
                    <FaRegMap className={"mr-sm-2 mr-0 mx-sm-0 mx-1"}/>
                    <span className={"d-inline-block align-middle"}>Roadmap</span>
                </RoadmapComponent>
                }
                {data.changelogEnabled &&
                <ChangelogComponent to={{pathname: "/b/" + data.discriminator + "/changelog", state: {_boardData: data}}}
                                    theme={context.getTheme()} border={selectedNode === "changelog" ? context.getTheme().setAlpha(.75) : undefined} aria-label={"Changelog"}>
                    <FaRegListAlt className={"mr-sm-2 mr-0 mx-sm-0 mx-1"}/>
                    <span className={"d-inline-block align-middle"}>Changelog</span>
                </ChangelogComponent>
                }
            </div>
        </UiContainer>
    </UiNavbar>
};

export default BoardNavbar;