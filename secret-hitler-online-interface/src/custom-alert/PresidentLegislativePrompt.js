import React, {Component} from 'react';
import PropTypes from "prop-types";
import FascistPolicy from "../assets/policy-fascist.png";
import LiberalPolicy from "../assets/policy-liberal.png";
import ButtonPrompt from "./ButtonPrompt";
import {
    COMMAND_REGISTER_PRESIDENT_CHOICE,
    LIBERAL,
    PARAM_CHOICE,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";

import '../util/PolicyDisplay.css';
import PolicyDisplay from "../util/PolicyDisplay";

class PresidentLegislativePrompt extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined,
            waitingForServer: false,
        };
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick() {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        data[PARAM_CHOICE] = this.state.selection;
        this.props.sendWSCommand(COMMAND_REGISTER_PRESIDENT_CHOICE, data);
    }

    // noinspection DuplicatedCode
    render() {
        return (
            <ButtonPrompt
                label={"LEGISLATIVE SESSION"}
                headerText={"Choose a policy to discard. The remaining policies are given to the chancellor."}
                buttonText={"DISCARD"}
                buttonOnClick={this.onButtonClick}
                buttonDisabled={this.state.selection === undefined || this.state.waitingForServer}
            >
                <PolicyDisplay
                    policies={this.props.policyOptions}
                    onClick={(index) => this.setState({selection: index})}
                    selection={this.state.selection}
                />
            </ButtonPrompt>
        );
    }

}

PresidentLegislativePrompt.propTypes = {
    policyOptions: PropTypes.array.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
};

export default PresidentLegislativePrompt;