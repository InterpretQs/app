import React, {useContext, useEffect, useState} from 'react';
import AppContext from "context/app-context";
import {Button, Col, OverlayTrigger, Tooltip} from "react-bootstrap";
import axios from "axios";
import {FaTrashAlt} from "react-icons/fa";
import {getSizedAvatarByUrl, toastError, toastSuccess} from "components/util/utils";
import InvitationModal from "components/modal/invitation-modal";
import copy from "copy-text-to-clipboard";
import AdminSidebar from "components/sidebar/admin-sidebar";
import {popupSwal} from "components/util/sweetalert-utils";
import ClickableTip from "components/util/clickable-tip";
import ViewBox from "components/viewbox/view-box";
import ComponentLoader from "components/app/component-loader";
import BoardContext from "context/board-context";
import DeleteButton from "components/util/delete-button";
import PageBadge from "components/app/page-badge";
import tinycolor from "tinycolor2";

const InvitationsSettings = ({reRouteTo}) => {
    const context = useContext(AppContext);
    const boardData = useContext(BoardContext).data;
    const [pendingInvitations, setPendingInvitations] = useState({data: [], loaded: false, error: false});
    const [invited, setInvited] = useState({data: [], loaded: false, error: false});
    const [modalOpen, setModalOpen] = useState(false);

    const onInvitationCreateModalClick = () => setModalOpen(true);
    const onInvitationCreateModalClose = () => setModalOpen(false);
    useEffect(() => {
        axios.get("/boards/" + boardData.discriminator + "/invitations").then(res => {
            if (res.status !== 200) {
                setPendingInvitations({...pendingInvitations, error: true});
                return;
            }
            const data = res.data;
            setPendingInvitations({...pendingInvitations, data, loaded: true});
        }).catch(() => setPendingInvitations({...pendingInvitations, error: true}));
        axios.get("/boards/" + boardData.discriminator + "/invitedUsers").then(res => {
            if (res.status !== 200) {
                setInvited({...invited, error: true});
                return;
            }
            const data = res.data;
            setInvited({...invited, data, loaded: true});
        }).catch(() => setInvited({...invited, error: true}));
        // eslint-disable-next-line
    }, []);
    const renderContent = () => {
        if (!boardData.privatePage) {
            return <Col xs={12}>
                <h2 className="text-danger">Feature Disabled</h2>
                <span><kbd>Private Board</kbd> option is disabled so you can't manage board invitations.
                    <br/>Enable it in <kbd>General</kbd> section to manage pending invitations and invited users.
                </span>
            </Col>
        }
        if (pendingInvitations.error) {
            return <span className="text-danger">Failed to obtain invitations data</span>
        }
        return <ComponentLoader loaded={pendingInvitations.loaded && invited.loaded} component={
            <React.Fragment>
                <InvitationModal onInvitationSend={onInvitationSend} onInvitationCreateModalClose={onInvitationCreateModalClose} data={boardData}
                                 session={context.user.session} open={modalOpen}/>
                <Col sm={6}>
                    <span className="mr-1 text-black-60">Pending Invitations</span>
                    <ClickableTip id="invitePending" title="Pending Invitations" description="Users whose invitations were not yet accepted."/>
                    <div className="mt-1">{renderInvitations()}</div>
                </Col>
                <Col sm={6} className="px-1">
                    <span className="mr-1 text-black-60">Invited Members</span>
                    <ClickableTip id="invited" title="Invited Members" description="Users who accepted invitation and can see your board. Can be kicked any time."/>
                    <div className="mt-1">{renderInvited()}</div>
                </Col>
                <Col xs={12}>
                    <Button className="m-0 mt-3 float-right" variant="" style={{backgroundColor: context.getTheme()}} onClick={onInvitationCreateModalClick}>Invite New</Button>
                </Col>
            </React.Fragment>
        }/>
    };
    const renderInvitations = () => {
        return pendingInvitations.data.map((invite, i) => {
            return <div className="d-inline-flex justify-content-center mr-2" key={i}>
                <div className="text-center">
                    <img alt="Invited" className="rounded-circle" src={getSizedAvatarByUrl(invite.user.avatar, 32)}
                         onError={(e) => e.target.src = process.env.REACT_APP_DEFAULT_USER_AVATAR} height={35} width={35}/>
                    <DeleteButton id={"deleteInvite_" + invite.user.id} onClick={() => onInvalidation(invite.id)} tooltipName="Invalidate"/>
                    <br/>
                    <small className="text-truncate d-block" style={{maxWidth: 100}}>{invite.user.username}</small>
                    <div className="cursor-click" onClick={() => {
                        copy(process.env.REACT_APP_SERVER_IP_ADDRESS + "/invitation/" + invite.code);
                        toastSuccess("Copied to clipboard.");
                    }}><PageBadge color={tinycolor(context.getTheme())} text="Copy Invite" className="move-top-3px"/></div>
                </div>
            </div>
        });
    };
    const renderInvited = () => {
        return invited.data.map((user, i) => {
            return <div className="d-inline-flex justify-content-center mr-2" key={i}>
                <div className="text-center">
                    <img alt="Invited" className="rounded-circle" src={getSizedAvatarByUrl(user.avatar, 32)}
                         onError={(e) => e.target.src = process.env.REACT_APP_DEFAULT_USER_AVATAR} height={35} width={35}/>
                    <DeleteButton id={"deleteInvited_" + user.id} onClick={() => onKick(user.id)} tooltipName="Kick Out"/>
                    <br/>
                    <small className="text-truncate d-block" style={{maxWidth: 100}}>{user.username}</small>
                </div>
            </div>
        });
    };
    const onInvalidation = (id) => {
        popupSwal("warning", "Dangerous action", "User will no longer be able to join the board with this invitation.",
            "Delete Invite", "#d33", willClose => {
                if (!willClose.value) {
                    return;
                }
                axios.delete("/invitations/" + id).then(res => {
                    if (res.status !== 204) {
                        toastError();
                        return;
                    }
                    const data = pendingInvitations.data.filter(item => item.id !== id);
                    setPendingInvitations({...pendingInvitations, data});
                    toastSuccess("Invitation removed.");
                }).catch(err => {
                    toastError(err.response.data.errors[0]);
                })
            });
    };
    const onKick = (id) => {
        popupSwal("warning", "Dangerous action", "User will no longer be able to see this board.",
            "Delete Invite", "#d33", willClose => {
                if (!willClose.value) {
                    return;
                }
                axios.delete("/boards/" + boardData.discriminator + "/invitedUsers/" + id).then(res => {
                    if (res.status !== 204) {
                        toastError();
                        return;
                    }
                    const data = invited.data.filter(item => item.id !== id);
                    setInvited({...invited, data});
                    toastSuccess("Invitation removed.");
                }).catch(err => {
                    toastError(err.response.data.errors[0]);
                })
            });
    };
    const onInvitationSend = (inviteData) => {
        const data = pendingInvitations.data.concat(inviteData);
        setPendingInvitations({...pendingInvitations, data});
    };

    return <React.Fragment>
        <AdminSidebar currentNode="invitations" reRouteTo={reRouteTo} data={boardData}/>
        <Col>
            <ViewBox theme={context.getTheme()} title="Invitations"
                     description="Invite and manage users of your private board here.">
                {renderContent()}
            </ViewBox>
        </Col>
    </React.Fragment>
};

export default InvitationsSettings;