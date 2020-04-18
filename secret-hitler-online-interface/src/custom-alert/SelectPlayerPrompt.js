import React, {Component} from 'react';
import PropTypes from "prop-types";
import PlayerPrompt from "./PlayerPrompt";
import {
    COMMAND_NOMINATE_CHANCELLOR, PARAM_FASCIST_POLICIES,
    PARAM_TARGET,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";
import {DISABLE_EXECUTED_PLAYERS, DISABLE_TERM_LIMITED_PLAYERS} from "../player/PlayerDisplay";

/**
 * Encapsulates a PlayerPrompt, and automatically locks the button after being pressed.
 * When button pressed, sends a specified command to the server.
 */
class SelectPlayerPrompt extends Component {

    timeOutID;

    constructor(props) {
        super(props);
        this.state = {
            waitingForServer: false,
        };
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
                headerText={props.headerText}
                renderHeader={props.renderHeader}
                gameState={props.gameState}
                disabledFilter={props.disabledFilter}
                buttonText={props.buttonText}
                buttonOnClick={this.onButtonClick}
                buttonDisabled={this.state.waitingForServer}
                user={props.user}
                includeUser={props.includeUser}
            />
        );
    }
}

SelectPlayerPrompt.defaultProps = {
    disabledFilter: DISABLE_EXECUTED_PLAYERS,
};

SelectPlayerPrompt.propTypes = {
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

export default SelectPlayerPrompt;

// Definitions for some basic templates.
/**
 * Returns the HTML for the NominationPrompt.
 * @param sendWSCommand {function} the callback function for sending websocket commands.
 * @param gameState {Object} the state of the game.
 * @param user {String} the name of the user.
 * @return
 */
export const SELECT_NOMINATION = (sendWSCommand, gameState, user) => {
    let shouldFascistVictoryWarningBeShown = gameState[PARAM_FASCIST_POLICIES] >= 3;

    return (
        <SelectPlayerPrompt
            user={user}
            commandType={COMMAND_NOMINATE_CHANCELLOR}
            label={"NOMINATION"}
            gameState={gameState}
            sendWSCommand={sendWSCommand}
            renderHeader={() => {
                return (
                    <div>
                        <p className="left-align">Nominate a player to become the next Chancellor.</p>
                        <p className="left-align highlight" hidden={!shouldFascistVictoryWarningBeShown}>
                            Fascists will win if Hitler is nominated and voted in as Chancellor!
                        </p>
                    </div>
                )
            }}
            disabledFilter={DISABLE_TERM_LIMITED_PLAYERS}
            includeUser={false}
        />
    )
};