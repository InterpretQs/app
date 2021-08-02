import {CardLinkStyle, IdeaCardDescription, InfoContainer} from "components/board/IdeaCard";
import MarkdownContainer from "components/commons/MarkdownContainer";
import VoteButton from "components/commons/VoteButton";
import {BoardContext, IdeaContext} from "context";
import React, {useContext, useEffect, useState} from "react";
import {FaRegComment} from "react-icons/all";
import {Link, useHistory, useLocation} from "react-router-dom";
import {UiRow} from "ui/grid";
import {convertIdeaToSlug} from "utils/basic-utils";

export const SimpleIdeaCard = ({ideaData}) => {
    const cardRef = React.createRef();
    const history = useHistory();
    const location = useLocation();
    const {data} = useContext(BoardContext);
    const [idea, setIdea] = useState(ideaData);
    useEffect(() => setIdea(ideaData), [ideaData]);
    const renderComments = () => {
        if (idea.commentsAmount > 0) {
            return <InfoContainer>
                {idea.commentsAmount}
                <FaRegComment className={"ml-1 move-top-2px"}/>
            </InfoContainer>
        }
    };
    return <IdeaContext.Provider value={{
        ideaData: idea, loaded: true, error: false,
        updateState: data => {
            setIdea(data);
            history.replace({pathname: location.pathname, state: null});
        },
    }}>
        <div ref={cardRef} id={"ideac_" + idea.id} className={"m-3"}>
            <UiRow>
                <span className={"my-auto mr-2"}>
                    <VoteButton idea={idea} animationRef={cardRef} onVote={(upvoted, votersAmount) => setIdea({...idea, upvoted, votersAmount})}/>
                </span>
                <CardLinkStyle as={Link} className={"d-inline text-left"} to={{pathname: "/i/" + convertIdeaToSlug(idea), state: {_ideaData: idea, _boardData: data}}}>
                    <div>
                        <div className={"d-inline mr-1"} style={{letterSpacing: `-.15pt`}}>
                            <span dangerouslySetInnerHTML={{__html: idea.title}}/>
                            {renderComments()}
                        </div>
                    </div>
                    <MarkdownContainer as={IdeaCardDescription} text={idea.description} truncate={85} stripped/>
                </CardLinkStyle>
            </UiRow>
        </div>
    </IdeaContext.Provider>
};