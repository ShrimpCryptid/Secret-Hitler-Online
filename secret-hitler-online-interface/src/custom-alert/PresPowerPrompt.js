import React, {Component} from 'react';
import PropTypes from "prop-types";
import PlayerPrompt from "./PlayerPrompt";
import {PARAM_TARGET, SERVER_TIMEOUT} from "../GlobalDefinitions";

/**
 * Encapsulates a PlayerPrompt, and automatically locks the button after being pressed.
 * When button pressed, sends a specified command to the server.
 */
class PresPowerPrompt extends Component {

    timeOutID;

    constructor(props) {
        super(props);

        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick(selectedItem) {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        data[PARAM_TARGET] = selectedItem;
        this.props.sendWSCommand(this.props.commandType, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID);
    }

    render() {
        let props = this.props;
        return (
            <PlayerPrompt
                label={props.label}
                headerText={props.label}
                renderHeader={props.renderHeader}
                gameState={props.gameState}
                disabledFilter={props.disabledFilter}
                buttonText={props.buttonText}
                buttonOnClick={this.onButtonClick}
                user={props.user}
                includeUser={props.includeUser}
            />
        );
    }
}

PresPowerPrompt.defaultProps = {

};

PresPowerPrompt.propTypes = {
    label: PropTypes.string.isRequired,
    headerText: PropTypes.string,
    renderHeader:PropTypes.func,

    gameState: PropTypes.object.isRequired,
    user: PropTypes.string.isRequired,
    disabledFilter: PropTypes.func, // By default, excludes deceased players
    includeUser: PropTypes.bool,

    buttonText: PropTypes.string,
    commandType: PropTypes.string.isRequired,
    sendWSCommand: PropTypes.func.isRequired
};

export default PresPowerPrompt;