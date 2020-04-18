import React, {Component} from 'react';
import PropTypes from "prop-types";
import {
    COMMAND_NOMINATE_CHANCELLOR,
    PARAM_FASCIST_POLICIES,
    PARAM_LAST_CHANCELLOR,
    PARAM_LAST_PRESIDENT,
    PARAM_PLAYERS,
    PLAYER_IS_ALIVE,
    PARAM_TARGET, SERVER_TIMEOUT
} from "../GlobalDefinitions";
import PlayerPrompt from "./PlayerPrompt";

class NominationPrompt extends Component {

    timeOutID;

    constructor(props) {
        super(props);
        this.state = {
            waitingForServer: false
        };

        this.onButtonClick = this.onButtonClick.bind(this);
    }

    shouldFascistVictoryWarningBeShown() {
        return this.props.gameState[PARAM_FASCIST_POLICIES] >= 3;
    }

    /**
     * A static filter that determines which players to disable.
     * @param name
     * @param game
     * @return {string}
     */
    playerDisabledFilter(name, game) {
        if (!game[PARAM_PLAYERS][name][PLAYER_IS_ALIVE]) {
            return "EXECUTED";
        } else if (game[PARAM_LAST_CHANCELLOR] === name || game[PARAM_LAST_PRESIDENT] === name) {
            return "TERM LIMITED";
        } else {
            return "";
        }
    }

    /**
     * Called when the confirm button is clicked.
     * @effects Attempts to send the server a command with the new chancellor nominee, and locks access to the button
     *          for {@code SERVER_TIMEOUT} ms.
     */
    onButtonClick(selectedItem) {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        data[PARAM_TARGET] = selectedItem;
        this.props.sendWSCommand(COMMAND_NOMINATE_CHANCELLOR, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID);
    }

    render() {
        return (
            <PlayerPrompt
                label = {"NOMINATION"}
                renderHeader={() => {
                        return (
                            <div>
                                <p className="left-align">Nominate a player to become the next Chancellor.</p>
                                <p className="left-align highlight" hidden={!this.shouldFascistVictoryWarningBeShown()}>
                                    Fascists will win if Hitler is nominated and voted in as Chancellor!
                                </p>
                            </div>
                        )
                    }
                }
                disabledFilter={this.playerDisabledFilter}
                user={this.props.user}
                gameState={this.props.gameState}
                onOptionSelected={this.onSelection}

                buttonDisabled={this.state.waitingForServer} // Disable if waiting for server contact
                buttonOnClick={this.onButtonClick}
            />
        )
    }

}

NominationPrompt.propTypes = {
    user: PropTypes.string,
    gameState: PropTypes.object.isRequired,
    sendWSCommand: PropTypes.func,
};

export default NominationPrompt;