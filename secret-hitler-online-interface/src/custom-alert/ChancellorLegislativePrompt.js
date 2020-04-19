import React, {Component} from 'react';
import PropTypes from "prop-types";
import FascistPolicy from "../assets/policy-fascist.png";
import LiberalPolicy from "../assets/policy-liberal.png";
import ButtonPrompt from "./ButtonPrompt";
import {
    COMMAND_REGISTER_CHANCELLOR_CHOICE, COMMAND_REGISTER_CHANCELLOR_VETO,
    LIBERAL,
    PARAM_CHOICE,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";

import '../util/PolicyDisplay.css';
import PolicyDisplay from "../util/PolicyDisplay";

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
            <ButtonPrompt
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
                <PolicyDisplay
                    policies={this.props.policyOptions}
                    onClick={(index) => this.setState({selection: index})}
                    selection={this.state.selection}
                />
            </ButtonPrompt>
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