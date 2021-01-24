import React, {useContext, useState} from 'react';
import StepFirst from "views/admin/subviews/social/steps/step-first";
import StepSecond from "views/admin/subviews/social//steps/step-second";
import {Col, Container, ProgressBar, Row} from "react-bootstrap";
import {toastAwait, toastError, toastSuccess, toastWarning} from "components/util/utils";
import axios from "axios";
import Steps, {Step} from "rc-steps";
import {Link, useHistory, withRouter} from "react-router-dom";
import tinycolor from "tinycolor2";

import "views/Steps.css";
import {NextStepButton, PreviousStepButton} from "components/steps/steps-buttons";
import BoardContext from "context/board-context";
import PageButton from "../../../../components/app/page-button";
import PageCancelButton from "../../../../components/app/page-cancel-button";

const CreateSocialLink = () => {
    const context = useContext(BoardContext);
    const boardData = context.data;
    const history = useHistory();
    const [settings, setSettings] = useState({step: 1, iconData: "", url: "", chosen: -1, customIcon: false});
    const renderStep = () => {
        switch (settings.step) {
            case 1:
                return <StepFirst updateSettings={updateSettings} settings={settings}/>;
            case 2:
                return <StepSecond updateSettings={updateSettings} settings={settings}/>;
            case 3:
                let toastId = toastAwait("Adding new social link...");
                axios.post("/boards/" + boardData.discriminator + "/socialLinks", {
                    iconData: settings.iconData, url: settings.url
                }).then(res => {
                    if (res.status !== 201) {
                        toastWarning("Couldn't add social link due to unknown error!", toastId);
                        return;
                    }
                    toastSuccess("Added new social link.", toastId);
                    history.push({
                        pathname: "/ba/" + boardData.discriminator + "/social",
                        state: null
                    });
                    const socialLinks = context.data.socialLinks.concat(res.data);
                    context.updateState({socialLinks});
                }).catch(err => {
                    toastError(err.response.data.errors[0], toastId);
                    setSettings({...settings, step: 2});
                });
                return <StepSecond updateSettings={updateSettings} settings={settings}/>;
            default:
                toastWarning("Setup encountered unexpected issue.");
                setSettings({...settings, step: 1});
                return <StepFirst updateSettings={updateSettings} settings={settings}/>;
        }
    };
    const updateSettings = (data) => {
        setSettings(data);
    };
    const renderBackButton = () => {
        if (settings.step === 1) {
            return <React.Fragment/>
        }
        return <PreviousStepButton previousStep={previousStep}/>
    };
    const renderNextButton = () => {
        if (settings.step >= 2) {
            return <PageButton color={tinycolor("#00c851")} className="ml-2" onClick={nextStep}>Finish</PageButton>
        }
        return <NextStepButton nextStep={nextStep}/>
    };
    const previousStep = () => {
        setSettings({...settings, step: settings.step - 1});
    };
    const nextStep = () => {
        if (settings.step === 1 && settings.iconData === "") {
            toastWarning("Icon must be chosen.");
            return;
        } else if (settings.step === 2 && settings.url === "") {
            toastWarning("URL must be typed.");
            return;
        }
        setSettings({...settings, step: settings.step + 1});
    };
    return <Col xs={12} md={9}>
        <Container>
            <Row className="mt-5">
                <Col xs={12} className="d-none d-sm-block">
                    <Steps direction="horizontal" size="small" progressDot current={settings.step}>
                        <Step title="Choose Icon"/>
                        <Step title="Set Link"/>
                        <Step title="Finish" state="finish"/>
                    </Steps>
                </Col>
                <Col xs={12} className="d-sm-none px-4">
                    <small>Step {settings.step}</small>
                    <ProgressBar now={settings.step * 33.3}/>
                </Col>
                {renderStep()}
                <Col xs={12} className="text-right mt-4">
                    <PageCancelButton as={Link} to={"/ba/" + boardData.discriminator + "/social"}>Cancel</PageCancelButton>
                    {renderBackButton()}
                    {renderNextButton()}
                </Col>
            </Row>
        </Container>
    </Col>
};

export default withRouter(CreateSocialLink);