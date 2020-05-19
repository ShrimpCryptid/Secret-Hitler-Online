import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Player from "./Player";
import {
    FASCIST,
    PARAM_PLAYERS,
    PLAYER_IDENTITY,
    PLAYER_IS_ALIVE,
    HITLER,
    LIBERAL,
    PARAM_CHANCELLOR,
    PARAM_PRESIDENT,
    PARAM_STATE,
    STATE_CHANCELLOR_NOMINATION,
    STATE_LEGISLATIVE_PRESIDENT,
    STATE_LEGISLATIVE_PRESIDENT_VETO,
    STATE_PP_PEEK,
    STATE_PP_ELECTION,
    STATE_PP_EXECUTION,
    STATE_PP_INVESTIGATE,
    STATE_POST_LEGISLATIVE,
    STATE_LEGISLATIVE_CHANCELLOR,
    STATE_CHANCELLOR_VOTING,
    PARAM_VOTES,
    PARAM_PLAYER_ORDER,
    PLAYER_INVESTIGATED, PARAM_LAST_CHANCELLOR, PARAM_LAST_PRESIDENT
} from "../GlobalDefinitions";
import './PlayerDisplay.css';

/**
 * Displays a row of player icons and handles displaying busy status, votes, and roles where applicable.
 */
class PlayerDisplay extends Component {

    // A map from the role to a boolean value determining if it should be shown.
    showRoleByRole = {FASCIST:false, HITLER:false, LIBERAL: false};
    playingVoteAnimation = false;
    // An array object that maps from each player's position in the order to
    // whether their vote should be shown. This allows the sequence to be animated.
    showPlayerVote = new Array(10).fill(false);

    constructor(props) {
        super(props);

        this.determineRolesToShow = this.determineRolesToShow.bind(this);
        this.onPlayerSelected = this.onPlayerSelected.bind(this);
        this.setupVoteAnimation = this.setupVoteAnimation.bind(this);
        this.resetVoteAnimation = this.resetVoteAnimation.bind(this);
    }

    /**
     * Updates which roles should be shown based on the role of the user.
     * @effects: if the user is {@code LIBERAL}, no roles will be shown.
     *           If {@code FASCIST}, {@code FASCIST} and {@code HITLER} roles will be shown.
     *           If there are {@literal <=} 6 players, then {@code HITLER} is the same as {@code FASCIST}.
     *           Otherwise, if {@code HITLER}, only {@code HITLER} roles will be shown.
     */
    determineRolesToShow() {
        if (this.props.user === undefined || !this.props.gameState[PARAM_PLAYERS].hasOwnProperty(this.props.user)) {
            return;
        }

        let playerOrder = this.props.gameState[PARAM_PLAYER_ORDER];
        let role = this.props.gameState[PARAM_PLAYERS][this.props.user][PLAYER_IDENTITY];

        switch (role) {
            case FASCIST:
                this.showRoleByRole = {FASCIST: true, HITLER: true, LIBERAL: false};
                break;
            case HITLER:
                if (playerOrder.length <= 6) {
                    this.showRoleByRole = {FASCIST: true, HITLER: true, LIBERAL: false};
                } else {
                    this.showRoleByRole = {FASCIST: false, HITLER: true, LIBERAL: false};
                }
                break;
            case LIBERAL:
            default:
                this.showRoleByRole = {FASCIST: false, HITLER: false, LIBERAL: false};
                break;
        }
    }

    /**
     * Returns a set of players that should be considered 'busy' and marked on the interface. A player is considered
     * busy if the game is waiting for some input from them.
     */
    getBusyPlayerSet() {
        let game = this.props.gameState;
        let busyPlayers = new Set([]);
        switch (game[PARAM_STATE]) {
            case STATE_CHANCELLOR_NOMINATION:
            case STATE_LEGISLATIVE_PRESIDENT:
            case STATE_LEGISLATIVE_PRESIDENT_VETO:
            case STATE_PP_PEEK:
            case STATE_PP_ELECTION:
            case STATE_PP_EXECUTION:
            case STATE_PP_INVESTIGATE:
            case STATE_POST_LEGISLATIVE:
                busyPlayers.add(game[PARAM_PRESIDENT]);
                break;
            case STATE_LEGISLATIVE_CHANCELLOR:
                busyPlayers.add(game[PARAM_CHANCELLOR]);
                break;
            case STATE_CHANCELLOR_VOTING:

                let playerOrder = this.getPlayerOrder();
                let i = 0;
                for (i; i < game[PARAM_PLAYER_ORDER].length; i++) {
                    let name = playerOrder[i];
                    let isAlive = game[PARAM_PLAYERS][name][PLAYER_IS_ALIVE];
                    if (!game[PARAM_VOTES].hasOwnProperty(name) && isAlive) { // player has not voted (is not in the map of votes) and is alive
                        busyPlayers.add(name);
                    }
                }

                break;
            default: // This includes the victory states and setup.
                break;
        }
        return busyPlayers;
    }

    /**
     * Returns an array representing the player order. Removes the player if this.props.includeUser is false.
     */
    getPlayerOrder() {
        let basePlayers;
        if (this.props.players === undefined) {
            basePlayers = this.props.gameState[PARAM_PLAYER_ORDER]
        } else if (!this.props.includeUser) {
            basePlayers = this.props.players;
        }

        if (!this.props.includeUser) {
            // Remove the user from the players.
            return basePlayers.filter(player => player !== this.props.user);
        }
        return basePlayers;
    }

    /**
     * Gets the HTML tags for the players in the provided indices.
     * @param start {int} the starting index, inclusive.
     * @param end {int} the ending index, exclusive.
     * @return {html[]} an array of html tags representing the players in indices {@code start} (inclusive)
     *         to {@code end} (exclusive).
     */
    getPlayerHTML(start, end) {
        let out = [];
        let players = this.props.gameState[PARAM_PLAYERS];
        let playerOrder = this.getPlayerOrder();
        let busyPlayers = this.getBusyPlayerSet();
        let i = 0;
        for (i; start + i < end; i++) {
            let index = i + start;
            let playerName = playerOrder[index];

            if (!players.hasOwnProperty(playerName)) {
                continue;
            }
            let playerData = players[playerName];

            let roleText = "";
            if (playerName === this.props.gameState[PARAM_CHANCELLOR]) {
                roleText = "CHANCELLOR";
            } else if (playerName === this.props.gameState[PARAM_PRESIDENT]) {
                roleText = "PRESIDENT";
            }

            let disabledText = this.props.playerDisabledFilter(playerName, this.props.gameState);
            let disabled = disabledText !== "";

            let label;
            if (this.props.showLabels) {
                label = (
                    <p id="player-display-label">{roleText}</p>
                );
            }

            let isSelected = this.props.selection === playerName;
            let onClick = () => {
                this.onPlayerSelected(playerName);
            };
            out[i] = (
                <div id={"player-display-text-container"} key={playerName}>
                    {label}
                    <Player
                        isBusy ={busyPlayers.has(playerName) && !this.props.showVotes && this.props.showBusy} // Do not show while voting.
                        role = {playerData[PLAYER_IDENTITY]}
                        showRole = {this.showRoleByRole[playerData[PLAYER_IDENTITY]] || playerName === this.props.user || this.props.showRoles}
                        highlight = {playerName === this.props.user}
                        disabled = {disabled}
                        disabledText = {disabledText}
                        name = {playerName}
                        useAsButton = {this.props.useAsButtons}
                        isSelected = {isSelected}
                        onClick = {onClick}
                        showVote={this.showPlayerVote[i + start]}
                        vote={this.props.gameState[PARAM_VOTES][playerName]}
                    />
                </div>
            )
        }
        return out;
    }

    /**
     * Called when the player is selected. Calls this.props.onSelection if the player is a valid choice.
     * @param name the name of the player.
     * @effects If the player should be disabled (ie, {@code this.props.playerDisabledFilter(name, gamestate) !== ""}), ignores the selection.
     *          If the player is already selected, ignores the selection.
     *          Otherwise, calls {@code.this.props.onSelection(name)}.
     */
    onPlayerSelected(name) {
        if (this.props.playerDisabledFilter(name, this.props.gameState) === ""
                && this.props.useAsButtons
                && name !== this.props.selection) {
            this.props.onSelection(name);
        }
    }

    /**
     * Creates the voting animation sequence.
     */
    setupVoteAnimation() {
        let duration = 1000;
        let playerOrder = this.getPlayerOrder();
        let numVotes = playerOrder.length;
        let timePerPlayer = duration / numVotes;
        let players = this.props.gameState[PARAM_PLAYERS];
        let delay = 0;
        for (let i = 0; i < playerOrder.length; i++) {
            this.showPlayerVote[i] = false;
            let playerName = playerOrder[i];
            if (players[playerName][PLAYER_IS_ALIVE]) { // player is eligible to vote
                setTimeout(() => {
                    this.showPlayerVote[i] = true;
                    this.forceUpdate();
                    i++;
                }, delay);
                delay += timePerPlayer;
            } else {
                setTimeout(() => {
                    this.showPlayerVote[i] = false;
                    i++;
                }, delay);
            }
        }
    }

    resetVoteAnimation () {
        this.showPlayerVote = new Array(10).fill(false);
    }

    /* Note that there are two player-display-containers, so that the player tiles can be split into two rows if there
    * is insufficient space for them.*/
    render() {
        let playerOrder = this.getPlayerOrder();
        // divides the playerOrder at the given index to allow for even groupings if the page is too narrow to fit
        // all players.
        let div1, div2;
        if (playerOrder.length <= 4) {
            // all players can be sorted into the first group.
            div1 = playerOrder.length;
            div2 = playerOrder.length;
        } else if (playerOrder.length <= 8) {
            // divide the players into two groups, with size preference given to the second group.
            div1 = Math.floor(playerOrder.length / 2);
            div2 = playerOrder.length;
        } else {
            div1 = Math.floor(playerOrder.length / 3);
            div2 = Math.floor(playerOrder.length * 2 / 3)
        }


        this.determineRolesToShow();

        if (this.props.showVotes && !this.playingVoteAnimation) {
            this.playingVoteAnimation = true;
            this.setupVoteAnimation();

        } else if (!this.props.showVotes && this.playingVoteAnimation) {
            this.playingVoteAnimation = false;
            this.resetVoteAnimation();
        }

        return (
            <div id="player-display">
                <div id="player-display-container">
                    {this.getPlayerHTML(0, div1)}
                </div>
                <div id="player-display-container">
                    {this.getPlayerHTML(div1, div2)}
                </div>
                <div id="player-display-container">
                    {this.getPlayerHTML(div2, playerOrder.length)}
                </div>
            </div>
        );
    }
}

// <editor-fold desc="Player Filters">

export const DISABLE_NONE = () => {return "";}

/**
 * Filter to disable only executed players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "" otherwise.
 */
export const DISABLE_EXECUTED_PLAYERS = (name, gameState) => {
    if (!gameState[PARAM_PLAYERS][name][PLAYER_IS_ALIVE]) {
        return "EXECUTED";
    }
    return "";
};

/**
 * Filter to disable executed and investigated players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "INVESTIGATED" if the player has been investigated,
 *                  "" otherwise.
 */
export const DISABLE_INVESTIGATED_PLAYERS = (name, gameState) => {
    if (!gameState[PARAM_PLAYERS][name][PLAYER_IS_ALIVE]) {
        return "EXECUTED";
    } else if (gameState[PARAM_PLAYERS][name][PLAYER_INVESTIGATED]) {
        return "SEARCHED";
    }
    return "";
};

/**
 * Filter to disable executed and investigated players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "TERM LIMITED" if the player is-term limited
 *                  (the last elected chancellor and, if >5 players, the last elected president.)
 *                  "" otherwise.
 */
export const DISABLE_TERM_LIMITED_PLAYERS = (name, gameState) => {
    // Count number of living players
    let livingPlayers = 0;
    for (let playerIndex in gameState[PARAM_PLAYER_ORDER]) {
        let playerName = gameState[PARAM_PLAYER_ORDER][playerIndex];
        if (gameState[PARAM_PLAYERS][playerName][PLAYER_IS_ALIVE]) {
            livingPlayers++;
        }
    }

    if (!gameState[PARAM_PLAYERS][name][PLAYER_IS_ALIVE]) {
        return "EXECUTED";
    } else if (gameState[PARAM_LAST_CHANCELLOR] === name) {
        return "TERM LIMITED";
    } else if (gameState[PARAM_LAST_PRESIDENT] === name && livingPlayers > 5) {
        return "TERM LIMITED";
    } else {
        return "";
    }
};

// </editor-fold>

PlayerDisplay.defaultProps = {
    user: "", /* The name of the user. */
    gameState: {},
    players: undefined,
    /* A function that returns a label based on a player name and the game state.
    *  A string that is non-empty represents a disabled player, and the string is used to label them. */
    playerDisabledFilter: DISABLE_EXECUTED_PLAYERS,
    onSelection: (name) => {console.log("Selected " + name + ".")}, // a callback function for when a player is selected.
    selection: undefined, // the name of the player that should be selected.
    useAsButtons: false,
    includeUser: true,
    showVotes: false,
    showRoles: false,
    showLabels: true
};

PlayerDisplay.propTypes = {
    user: PropTypes.string.isRequired,
    gameState: PropTypes.object.isRequired,
    players: PropTypes.array, // Optional. If not undefined, shows only the listed players instead of all players.

    playerDisabledFilter: PropTypes.func,
    onSelection: PropTypes.func,
    selection: PropTypes.string,
    useAsButtons: PropTypes.bool,
    showVotes: PropTypes.bool,
    showLabels: PropTypes.bool,
    showRoles: PropTypes.bool,
    showBusy: PropTypes.bool,
    includeUser: PropTypes.bool,
};


export default PlayerDisplay;