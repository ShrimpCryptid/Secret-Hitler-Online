import React, {Component} from 'react';
import PlayerDisplay from "../player/PlayerDisplay";
import {
    PARAM_FASCIST_POLICIES,
    PARAM_LAST_CHANCELLOR,
    PARAM_LAST_PRESIDENT,
    PARAM_PLAYERS,
    PLAYER_IS_ALIVE
} from "../GlobalDefinitions";
import OptionPrompt from "./OptionPrompt";

/**
 * A PlayerPrompt is the content for an alert box. It has a header, text, and a PlayerList, as well
 * as an associated button.
 */
class PlayerPrompt extends OptionPrompt {

    constructor(props) {
        super(props);
    }


    renderOptions() {
        return (
            <PlayerDisplay
                gameState = {this.props.gameState}
                user={this.props.user}
                excludeUser = {true}
                useAsButtons = {true}
                playerDisabledFilter = {this.playerDisabledFilter}
                showLabels = {false}
                selection = {this.state.selectedItem}
                onSelection = {this.onSelectionChanged}
            />
        );
    }

}

export default PlayerPrompt;