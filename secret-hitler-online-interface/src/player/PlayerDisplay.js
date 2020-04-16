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
    STATE_POST_LEGISLATIVE, STATE_LEGISLATIVE_CHANCELLOR, STATE_CHANCELLOR_VOTING, PARAM_VOTES, PARAM_PLAYER_ORDER
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

                let playerOrder = game[PARAM_PLAYER_ORDER];
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
     * Gets the HTML tags for the players in the provided indices.
     * @param start {int} the starting index, inclusive.
     * @param end {int} the ending index, exclusive.
     * @return {html[]} an array of html tags representing the players in indices {@code start} (inclusive)
     *         to {@code end} (exclusive).
     */
    getPlayers(start, end) {
        let out = [];
        let players = this.props.gameState[PARAM_PLAYERS];
        let playerOrder = this.props.gameState[PARAM_PLAYER_ORDER];
        let busyPlayers = this.getBusyPlayerSet();
        let i = 0;
        for (i; start + i < end; i++) {
            let index = i + start;
            let playerName = playerOrder[index];
            let playerData = players[playerName];

            if(this.props.excludeUser && playerName === this.props.user) { // skip this user
                continue;
            }

            let roleText = "";
            if (playerName === this.props.gameState[PARAM_CHANCELLOR]) {
                roleText = "CHANCELLOR";
            } else if (playerName === this.props.gameState[PARAM_PRESIDENT]) {
                roleText = "PRESIDENT";
            }

            let disabledText = this.props.playerDisabledFilter(playerName, this.props.gameState);
            let disabled = false;
            if (disabledText !== "") {
                disabled = true;
            }

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
                        showRole = {this.showRoleByRole[playerData[PLAYER_IDENTITY]] || playerName === this.props.user}
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
        let numVotes = this.props.gameState[PARAM_PLAYER_ORDER].length;
        let timePerPlayer = duration / numVotes;
        let playerOrder = this.props.gameState[PARAM_PLAYER_ORDER];
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
        let playerOrder = this.props.gameState[PARAM_PLAYER_ORDER];
        let middleIndex;
        if (this.props.excludeUser) { // if excluding the user, account for smaller set of players.
            middleIndex = Math.floor((playerOrder.length - 1) / 2);
        } else {
            middleIndex = Math.floor(playerOrder.length / 2);
        }
        this.determineRolesToShow();

        if (this.props.showVotes && !this.playingVoteAnimation) {
            console.log("Changing state to play animation.");
            this.playingVoteAnimation = true;
            this.setupVoteAnimation();

        } else if (!this.props.showVotes && this.playingVoteAnimation) {
            console.log("Stopping animation.");
            this.playingVoteAnimation = false;
            this.resetVoteAnimation();
        }

        return (
            <div id="player-display">
                <div id="player-display-container">
                    {this.getPlayers(0, middleIndex)}
                </div>
                <div id="player-display-container">
                    {this.getPlayers(middleIndex, playerOrder.length)}
                </div>
            </div>
        );
    }
}

PlayerDisplay.defaultProps = {
    user: "", /* The name of the user. */
    gameState: {},
    /* A function that returns a label based on a player name and the game state.
    *  A string that is non-empty represents a disabled player, and the string is used to label them. */
    playerDisabledFilter: (name, state) => {
        if (!state[PARAM_PLAYERS][name][PLAYER_IS_ALIVE]) {
            return "EXECUTED";
        }
        return "";
    },
    onSelection: (name) => {console.log("Selected " + name + ".")}, // a callback function for when a player is selected.
    selection: undefined, // the name of the player that should be selected.
    useAsButtons: false,
    excludeUser: false,
    showVotes: false,
    showLabels: true
};

PlayerDisplay.propTypes = {
    user: PropTypes.string,
    gameState: PropTypes.object.isRequired,
    playerDisabledFilter: PropTypes.func,
    onSelection: PropTypes.func,
    selection: PropTypes.string,
    useAsButtons: PropTypes.bool,
    showVotes: PropTypes.bool,
    showLabels: PropTypes.bool,
    showBusy: PropTypes.bool,
};


export default PlayerDisplay;