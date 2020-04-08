import React, {Component} from 'react';
import PropTypes from "prop-types";
import FascistPolicy from "../assets/policy-fascist.png";
import LiberalPolicy from "../assets/policy-liberal.png";
import OptionPrompt from "./OptionPrompt";
import {
    COMMAND_REGISTER_PRESIDENT_CHOICE,
    LIBERAL,
    PARAM_CHOICE,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";

import './LegislativePrompt.css';

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
            <OptionPrompt
                label={"LEGISLATIVE SESSION"}
                headerText={"Choose a policy to discard. The remaining policies are given to the chancellor."}
                buttonText={"DISCARD"}
                buttonOnClick={this.onButtonClick}
                buttonDisabled={this.state.selection === undefined || this.state.waitingForServer}
            >
                <div id={"legislative-policy-container"}>
                    {this.props.policyOptions.map((value, index) => {
                        let policyName = value === LIBERAL ? "liberal" : "fascist";
                        return (
                            <img
                                id={"legislative-policy"}
                                className={"selectable " + (index === this.state.selection ? " selected" : "")} // Mark as selectable (and selected)
                                onClick={() => {this.setState({selection: index});}}
                                src={value === LIBERAL ? LiberalPolicy : FascistPolicy} // Toggles fascist/liberal policy
                                alt={"A " + policyName + " policy. Click to select."}
                            />
                        );
                    } )}
                </div>
            </OptionPrompt>
        );
    }

}

PresidentLegislativePrompt.propTypes = {
    policyOptions: PropTypes.array.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
};

export default PresidentLegislativePrompt;