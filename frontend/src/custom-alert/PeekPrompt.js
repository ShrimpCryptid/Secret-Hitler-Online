import React, {Component} from 'react';
import PropTypes from "prop-types";
import {
    COMMAND_REGISTER_PEEK,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";
import PolicyDisplay from "../util/PolicyDisplay";
import ButtonPrompt from "./ButtonPrompt";

class PeekPrompt extends Component {

    timeOutID;

    constructor(props) {
        super(props);
        this.state = {
            waitingForServer: false,
            selection: undefined,
        };
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick() {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        this.props.sendWSCommand(COMMAND_REGISTER_PEEK, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID);
    }

    render() {
        return (
            <ButtonPrompt
                label={"PEEK"}
                headerText={"These are the next three policies in the draw deck."}
                buttonText={"OKAY"}
                buttonOnClick={this.onButtonClick}
                buttonDisabled={this.state.waitingForServer}
            >
                <PolicyDisplay
                    policies={this.props.policies}
                    onClick={(index) => this.setState({selection: index})}
                    allowSelection={false}
                />
            </ButtonPrompt>
        );
    }
}

PeekPrompt.propTypes = {
    policies: PropTypes.array,
    sendWSCommand: PropTypes.func.isRequired,
};

export default PeekPrompt;