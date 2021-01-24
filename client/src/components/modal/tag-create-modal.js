import React, {useState} from 'react';
import Form from "react-bootstrap/Form";
import axios from "axios";
import {toastError, toastSuccess, toastWarning} from "components/util/utils";
import PageModal from "components/modal/page-modal";
import ClickableTip from "components/util/clickable-tip";
import {Col, Row} from "react-bootstrap";
import ColorSelectionHelper from "components/modal/color-selection-helper";
import ExecutableButton from "components/app/executable-button";
import tinycolor from "tinycolor2";
import PageCountableFormControl from "../app/page-countable-form-control";

const TagCreateModal = ({open, onTagCreateModalClose, data, onTagCreate}) => {
    const [color, setColor] = useState("#0994f6");

    const handleSubmit = () => {
        const name = document.getElementById("tagNameTextarea").value;
        if (name.length < 3 || name.length > 20) {
            toastWarning("Tag name must be between 3 and 20 characters.");
            return Promise.resolve();
        }
        const roadmapIgnored = document.getElementById("roadmapIgnored").checked;
        const publicUse = document.getElementById("publicUse").checked;
        return axios.post("/boards/" + data.discriminator + "/tags", {
            name, color, roadmapIgnored, publicUse,
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                toastError();
                return;
            }
            onTagCreateModalClose();
            onTagCreate(res.data);
            toastSuccess("Tag with name " + name + " created.");
        }).catch(err => toastError(err.response.data.errors[0]));
    };
    return <PageModal id="tagCreate" isOpen={open} onHide={onTagCreateModalClose} title="Add new Tag"
                      applyButton={<ExecutableButton onClick={handleSubmit} className="mx-0">Save</ExecutableButton>}>
        <Row>
            <Col xs={12} className="mt-2 mb-1">
                <Form.Label className="mr-1 text-black-60">Tag Name</Form.Label>
                <ClickableTip id="tagName" title="Tag Name" description="Descriptive and under 20 characters name of tag."/>
                <PageCountableFormControl id="tagNameTextarea" minLength={2} maxLength={15} placeholder={"Short and descriptive."}/>
            </Col>
            <Col xs={12} sm={6} className="mb-2">
                <ColorSelectionHelper title="Tag Color" color={tinycolor(color)} setColor={setColor} colorWarning={true}/>
            </Col>
            <Col xs={12} sm={6} className="mb-2">
                <div>
                    <Form.Label className="mr-1 text-black-60">Ignore Roadmap</Form.Label>
                    <ClickableTip id="tagColor" title="Ignore Roadmap" description="Select if you don't want to include show tag and ideas with this tag in roadmap view."/>
                    <br/>
                    <Form.Check id="roadmapIgnored" custom inline label="Roadmap Ignored" type="checkbox" defaultChecked={false}/>
                </div>
                <div className="mt-2">
                    <Form.Label className="mr-1 text-black-60">Publicly Accessbile</Form.Label>
                    <ClickableTip id="tagColor" title="Ignore Roadmap" description="Select if you want this tag to be selectable by users when they create new ideas."/>
                    <br/>
                    <Form.Check id="publicUse" custom inline label="Public Use" type="checkbox" defaultChecked={false}/>
                </div>
            </Col>
        </Row>
    </PageModal>
};

export default TagCreateModal;