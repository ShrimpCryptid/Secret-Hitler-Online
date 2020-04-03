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
            selectedPlayer:undefined
        }
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
            selectedPlayer: name
        });
    }

    render() {
        return (
            <div>
                <h2>NOMINATION</h2>
                <p className="left-align">Nominate a player to become the next Chancellor.</p>
                <p className="left-align highlight" hidden={this.shouldFascistVictoryWarningBeShown()}>
                    Fascists will win if Hitler is successfully voted in as Chancellor!
                </p>

                <PlayerDisplay
                    gameState = {this.props.gameState}
                    user={this.props.user}
                    excludeUser = {true}
                    useAsButtons = {true}
                    playerDisabledFilter = {this.playerDisabledFilter}
                    showLabels = {false}
                    selection = {this.state.selectedPlayer}
                    onSelection = {this.onSelectionChanged}
                />
                <button>CONFIRM</button>
            </div>
        )
    }

}

NominationPrompt.defaultProps = {
    user: undefined,
    gameState: {}
};

export default NominationPrompt;