import React, {useContext} from "react";
import {FaFrown} from "react-icons/all";
import AppContext from "context/app-context";
import PageAvatar from "components/app/page-avatar";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import LoadingSpinner from "../../util/loading-spinner";
import IdeaContext from "../../../context/idea-context";

const VotersComponent = ({data}) => {
    const context = useContext(AppContext);
    const {votersAmount} = useContext(IdeaContext).ideaData;
    const renderVoters = () => {
        if (!data.loaded) {
            const voters = votersAmount > 5 ? 5 : votersAmount;
            let spinners = [];
            for (let i = 0; i < voters; i++) {
                spinners.push(<LoadingSpinner key={i} customSize={23} color={context.getTheme()} className="voter-merged" style={{
                    verticalAlign: "text-bottom", margin: "0 -10px 0 0", color: context.getTheme()
                }}/>);
            }
            if (votersAmount <= 5) {
                return <React.Fragment>{spinners}</React.Fragment>
            }
            return <React.Fragment>
                {spinners}
                <span className="d-inline-block voters-and-more" style={{transform: "translateY(-4px)"}}> + {votersAmount - 5} more</span>
            </React.Fragment>
        }
        if (data.error) {
            return <div className="text-danger"><FaFrown className="move-top-2px"/> Failed to load</div>
        }
        if (data.data.length === 0) {
            return <div style={{height: 25}}><FaFrown className="move-top-2px"/> None</div>
        }
        return <div>
            {data.data.slice(0, 5).map(dataUser => {
                return <OverlayTrigger key={dataUser.id} overlay={<Tooltip id={"voterData" + dataUser.id}>{dataUser.username}</Tooltip>}>
                    <PageAvatar className="voter-merged" roundedCircle user={dataUser} size={25}/>
                </OverlayTrigger>
            })}
            {renderAndMore()}
        </div>
    };

    const renderAndMore = () => {
        if (data.data.length <= 5) {
            return;
        }
        return <span className="voters-and-more"> + {data.data.length - 5} more</span>
    };
    return <React.Fragment>
        <div className="mt-4 text-black-75">Voters ({votersAmount} votes)</div>
        {renderVoters()}
    </React.Fragment>
};

export default VotersComponent;