import React, {Component} from 'react';

import './Player.css'
import {Textfit} from 'react-textfit';

import PlayerBase from "./assets/player-base.png"
import PlayerBaseDisabled from "./assets/player-base-unselectable.png";

import IconFascist from "./assets/player-icon-fascist.png";
import IconHitler from "./assets/player-icon-hitler.png";
import IconLiberal from "./assets/player-icon-liberal.png";

import IconBusy from "./assets/player-icon-busy.png";

const LIBERAL = "LIBERAL";
const FASCIST = "FASCIST";
const HITLER = "HITLER";

/**
 * A visual representation of a player, including their name and (optionally) their role.
 */
class Player extends Component {

    /**
     * Gets the player image base, swapping to the darkened version if {@code this.props.disabled} is true.
     */
    getImg() {
        if (this.props.disabled) {
            return PlayerBaseDisabled;
        } else {
            return PlayerBase;
        }
    }

    /**
     * Gets the relevant icon for the Player based on {@code this.props.role}
     * @return {image} the image source for either the liberal, fascist, or hitler icons.
     */
    getIcon() {
        switch (this.props.role) {
            case LIBERAL:
                return IconLiberal;
            case FASCIST:
                return IconFascist;
            case HITLER:
            default:
                return IconHitler;
        }
    }

    /**
     * Capitalizes only the first character of the given text.
     * @param {String} text the text to capitalize.
     * @return {String} text where only the first character is uppercase.
     */
    capitalizeFirstOnly(text) {
        return text.charAt(0).toUpperCase() + text.toLowerCase().substr(1);
    }

    /**
     * Changes the className based on the role (so that liberals can have blue text coloring).
     * @return {string} " liberal-text" if the role is LIBERAL. Otherwise, returns "".
     */
    getRoleClass() {
        if(this.props.role === LIBERAL) {
            return " liberal-text";
        } else {
            return "";
        }
    }

    /**
     * Darkens the text, images, and background if disabled.
     * @return {String} If {@code this.props.disabled} is true, returns " darken", otherwise returns empty string.
     */
    getDarken() {
        if (this.props.disabled) {
            return " darken";
        }
        return "";
    }

    /**
     * Gets the alt text for all images.
     * @return {String} {@code this.getNameWithYouTag}.
     *          If this.props.showRole, appends a formatted version of "({@code this.props.role"})"
     */
    getAltText() {
        if (this.props.showRole) {
            return this.getNameWithYouTag() + this.capitalizeFirstOnly(this.props.role);
        } else {
            return this.getNameWithYouTag();
        }
    }

    /**
     * Returns the name of the player, with an optional " (you)" tag if {@code this.props.isUser.}
     */
    getNameWithYouTag() {
        if (this.props.isUser) {
            return this.props.name + " (you)";
        } else {
            return this.props.name;
        }
    }

    render() {
        return (
            <div id="player-container">
                <img id="player-image"
                     src={PlayerBase}
                     alt={this.getAltText()}
                     className={this.getDarken()}
                />

                <Textfit id={"player-name"}
                         className={this.getDarken()}
                         mode="multi"
                         forceSingleModeWidth={false}
                >
                    {this.getNameWithYouTag()}
                </Textfit>

                <img id="player-busy-icon"
                     src={IconBusy}
                     hidden={!this.props.isBusy}
                     alt=""
                />

                <img id="player-identity-icon"
                     className={this.getDarken()}
                     src={this.getIcon()}
                     hidden={!this.props.showRole}
                     alt={this.getAltText()}
                />

                <p      id="player-identity-label"
                        className={this.getRoleClass() + this.getDarken()}
                        hidden={!this.props.showRole}>
                    {this.capitalizeFirstOnly(this.props.role)}
                </p>

                <p  id="player-disabled-label"
                    hidden={!this.props.disabled}
                >
                    {this.props.disabledText}
                </p>

             </div>
        );
    }

}

Player.defaultProps = {
    isBusy: false,
    name: "Name Here",
    role: "FASCIST",
    showRole: true,
    disabled: false,
    disabledText: "EXECUTED",
    isUser: false
};

export default Player;