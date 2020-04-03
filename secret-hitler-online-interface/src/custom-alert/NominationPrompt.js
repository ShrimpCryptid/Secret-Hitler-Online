import React, {Component} from 'react';
import PlayerDisplay from "../player/PlayerDisplay";
import {
    PARAM_FASCIST_POLICIES,
    PARAM_LAST_CHANCELLOR,
    PARAM_LAST_PRESIDENT,
    PARAM_PLAYERS,
    PLAYER_IS_ALIVE
} from "../GlobalDefinitions";

class NominationPrompt extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedItem:undefined
        };
        this.onSelectionChanged = this.onSelectionChanged.bind(this);
    }

    shouldFascistVictoryWarningBeShown() {
        return this.props.gameState[PARAM_FASCIST_POLICIES] >= 3;
    }

    /**
     * A static filter passed to the PlayerList.
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
     * Changes the selected player.
     * @param name
     */
    onSelectionChanged(name) {
        this.setState({
            selectedItem: name
        });
    }

    shouldButtonBeDisabled() {
        return this.state.selectedItem === undefined;
    }

    onConfirmButtonClick() {
        // First, send a message to the
    }

    render() {
        return (
            <div>
                <h2>NOMINATION</h2>
                <p className="left-align">Nominate a player to become the next Chancellor.</p>
                <p className="left-align highlight"
                    hidden={!this.shouldFascistVictoryWarningBeShown()}>
                    Fascists will win if Hitler is nominated and voted in as Chancellor!
                </p>


                <button
                    disabled={this.shouldButtonBeDisabled()}
                    onClick={this.onConfirmButtonClick}
                >CONFIRM</button>
            </div>
        )
    }

}

NominationPrompt.defaultProps = {
    user: undefined,
    gameState: {},
    selectedItem: undefined
};

export default NominationPrompt;