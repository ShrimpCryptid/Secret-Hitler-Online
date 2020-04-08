import React, {Component} from 'react';
import PropTypes from "prop-types";
import FascistPolicy from "../assets/policy-fascist.png";
import LiberalPolicy from "../assets/policy-liberal.png";
import OptionPrompt from "./OptionPrompt";
import {
    COMMAND_REGISTER_CHANCELLOR_CHOICE, COMMAND_REGISTER_CHANCELLOR_VETO,
    LIBERAL,
    PARAM_CHOICE,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";

import './LegislativePrompt.css';

class ChancellorLegislativePrompt extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined,
            waitingForServer: false,
        };
        this.onEnactButtonClick = this.onEnactButtonClick.bind(this);
        this.onVetoButtonClick = this.onVetoButtonClick.bind(this);
    }

    onEnactButtonClick() {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        data[PARAM_CHOICE] = this.state.selection;
        this.props.sendWSCommand(COMMAND_REGISTER_CHANCELLOR_CHOICE, data);
    }

    onVetoButtonClick() {
        if (this.props.fascistPolicies === 5) { // If veto power is activated:
            // Lock the button so that it can't be pressed multiple times.
            this.setState({waitingForServer: true});
            setTimeout(() => {
                this.setState({waitingForServer: false})
            }, SERVER_TIMEOUT);

            this.props.sendWSCommand(COMMAND_REGISTER_CHANCELLOR_VETO);
        } else { // veto power is not activated
            this.props.showError("Veto power is unlocked when there are 5 fascist policies.");
        }
    }

    // noinspection DuplicatedCode
    render() {
        let props = this.props;
        return (
            <OptionPrompt
                label={"LEGISLATIVE SESSION"}
                headerText={"Choose a policy to enact. The remaining policy will be discarded."}
                renderHeader={ () => {
                    return (<>
                        <p className={"left-align"}>
                            Choose a policy to enact. The remaining policy will be discarded.
                        </p>
                        {props.fascistPolicies === 5 &&
                        <p className={"left-align highlight"}>
                            Veto power unlocked: If you choose to veto and the president agrees to the veto, the agenda will be discarded.
                        </p>
                        }
                    </>);}
                }

                renderButton={() => {
                    return (
                        <div id={"legislative-button-container"}>
                            <button onClick={this.onVetoButtonClick}
                                    disabled={!this.props.enableVeto || this.state.waitingForServer}>
                                VETO
                            </button>
                            <button onClick={this.onEnactButtonClick}
                                    disabled={this.state.selection === undefined || this.state.waitingForServer}>
                                ENACT
                            </button>
                        </div>)
                    ;}
                }
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

ChancellorLegislativePrompt.defaultProps = {
    enableVeto: true,
};

ChancellorLegislativePrompt.propTypes = {
    policyOptions: PropTypes.array.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
    fascistPolicies: PropTypes.number.isRequired,
    showError: PropTypes.func.isRequired,
    enableVeto: PropTypes.bool,
};

export default ChancellorLegislativePrompt;