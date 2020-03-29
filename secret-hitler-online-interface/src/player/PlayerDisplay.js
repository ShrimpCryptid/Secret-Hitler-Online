import React, {Component} from 'react';
import Player from "./Player";
import {} from "../GlobalDefinitions";
import {FASCIST} from "../GlobalDefinitions";
import {PLAYER_NAME} from "../GlobalDefinitions";
import {PLAYER_IDENTITY} from "../GlobalDefinitions";
import {PLAYER_IS_ALIVE} from "../GlobalDefinitions";


/**
 * Displays a row of player icons and handles displaying busy status, votes, and roles where applicable.
 */
class PlayerDisplay extends Component {

    // A map from the role to a boolean value determining if it should be shown.
    showRoleByRole = {FASCIST:false, HITLER:false, LIBERAL: false};

    constructor(props) {
        super(props);
        this.getUserRole = this.getUserRole.bind(this);
        this.determineRolesToShow();
    }

    /**
     * Updates which roles should be shown based on the role of the user.
     * @effects: if the user is {@code LIBERAL}, no roles will be shown.
     *           If {@code FASCIST}, {@code FASCIST} and {@code HITLER} roles will be shown.
     *           If there are {@literal <=} 6 players, then {@code HITLER} is the same as {@code FASCIST}.
     *           Otherwise, if {@code HITLER}, only {@code HITLER} roles will be shown.
     */
    determineRolesToShow() {
        let i = 0;
        let role = FASCIST;
        for (i; i < this.props.playerList.length; i++) {
            let playerData = this.props.playerList.get(i);
            if (playerData[PLAYER_NAME] === this.props.user) {
                role = playerData[PLAYER_IDENTITY];
                break;
            }
        }

        switch (role) {
            case FASCIST:
                this.showRoleByRole = {FASCIST: true, HITLER: true, LIBERAL: false};
                break;
            case HITLER:
                if (this.props.playerList.length <= 6) {
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
     * Gets the HTML tags for the players in the provided indices.
     * @param start {int} the starting index, inclusive.
     * @param end {int} the ending index, exclusive.
     * @return {html[]} an array of html tags representing the players in indices {@code start} (inclusive)
     *         to {@code end} (exclusive).
     */
    getPlayers(start, end) {
        let out = [];
        let i = 0;
        for (i; start + i < end; i++) {
            let index = i + start;
            let playerData = this.props.playerList[index];
            out[i] = (
                <div id={"player-display-text-container"}>
                    <p id="player-display-label">CHANCELLOR</p>
                    <Player
                        isBusy ={false}
                        role = {playerData[PLAYER_IDENTITY]}
                        showRole = {this.showRoleByRole[playerData[PLAYER_IDENTITY]] || playerData[PLAYER_NAME] === this.props.user}
                        isUser = {playerData[PLAYER_NAME] === this.props.user}
                        disabled = {playerData[PLAYER_IS_ALIVE]}
                        name = {playerData[PLAYER_NAME]}
                    />
                </div>
            )
        }
        return out;
    }

    /* Note that there are two player-display-containers, so that the player tiles can be split into two rows if there
    * is insufficient space for them.*/
    render() {
        let middleIndex = Math.floor(this.props.playerList.length / 2);
        this.determineRolesToShow();
        return (
            <div id="player-display">
                <div id="player-display-container">
                    {this.getPlayers(0, middleIndex)}
                </div>
                <div id="player-display-container">
                    {this.getPlayers(middleIndex, this.props.playerList.length)}
                </div>
            </div>
        );
    }
}

PlayerDisplay.defaultProps = {
    playerList: [{"alive":true,"identity":"LIBERAL","investigated":false,"username":"kjh"},{"alive":true,"identity":"LIBERAL","investigated":false,"username":"fff"},{"alive":true,"identity":"FASCIST","investigated":false,"username":"t"},{"alive":true,"identity":"HITLER","investigated":false,"username":"qweq"},{"alive":true,"identity":"LIBERAL","investigated":false,"username":"sdfs"}],
    busy: [],
    currentPresident: "kjh",
    currentChancellor: "fff",
    user: "kjh", /* The name of the user. */
};

export default PlayerDisplay;