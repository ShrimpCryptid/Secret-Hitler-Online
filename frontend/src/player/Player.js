import React, {Component} from 'react';
import PropTypes from "prop-types";

import './Player.css'
import '../selectable.css'
import {Textfit} from 'react-textfit';

import PlayerBase from "../assets/player-base.png"

import IconFascist from "../assets/player-icon-fascist.png";
import IconHitler from "../assets/player-icon-hitler.png";
import IconLiberal from "../assets/player-icon-liberal.png";

import IconBusy from "../assets/player-icon-busy.png";

import YesVote from "../assets/player-icon-ja.png";
import NoVote from "../assets/player-icon-nein.png";
import portraits, {portraitsAltText} from "../assets";

const LIBERAL = "LIBERAL";
const FASCIST = "FASCIST";
const HITLER = "HITLER";

/**
 * A visual representation of a player, including their name and (optionally) their role.
 */
class Player extends Component {

    constructor(props) {
        super(props);
        this.state = {
            initialState: true,
            initialVoteState: true,
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
     * Darkens the text, images, and background if disabled and highlights the player.
     * @return {String} If {@code this.props.disabled} is true, the output will include the substring " darken".
     *                  If {@code this.props.isUser} is true, the output will include the substring " highlight".
     *                  Otherwise, the output is the empty string.
     */
    getClassName() {
        let out = "";
        if (this.props.disabled) {
            out += " darken";
        }

        return out;
    }

    getHighlight() {
        if (this.props.highlight) {
            return " highlight";
        }
        return "";
    }

    /**
     * Gets the classname for the div if selectable.
     * @return {string} If currently selected, returns " selectable selected" to set the background color of the div.
     *                  Else if {@code this.props.useAsButton}, returns " selectable". Otherwise, returns "".
     */
    getButtonClass() {
        if (this.props.useAsButton && !this.props.disabled) {
            if (this.props.isSelected) {
                return " selectable selected";
            } else {
                return " selectable";
            }
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
        // noinspection HtmlUnknownAttribute
        if (this.state.initialState && this.props.isBusy) {
            this.setState({initialState: false});
        }

        if (this.props.showVote && this.state.initialVoteState) {
            this.setState({initialVoteState: false});
        }

        let identity_components;
        // Conditionally rendered so information is not visible in Inspector view
        if (this.props.showRole) {
            identity_components = <>
                    <img id="player-identity-icon"
                         className={this.getClassName()}
                         src={this.getIcon()}
                         alt={this.getAltText()}
                    />

                    <p id="player-identity-label"
                       className={this.getRoleClass() + this.getClassName() + " force-update"}
                    >
                        {this.capitalizeFirstOnly(this.props.role)}
                    </p>
                </>
        }

        return (
            <div id="player-container"
                className={this.getHighlight() + this.getClassName() + this.getButtonClass()}
                 onClick = {this.props.onClick}
                 disabled = {this.props.disabled}
            >
                <img id="player-image"
                     src={PlayerBase}
                     alt={this.getAltText()}
                     className={this.getClassName()}
                />

                <img id={"player-icon"}
                     alt={portraitsAltText[this.props.icon]}
                     src={portraits[this.props.icon]}
                     className={this.getClassName()}
                />

                <img id="player-busy-icon"
                     src={IconBusy}
                     className={this.state.initialState ? "player-icon-default" :(this.props.isBusy ? "player-icon-show" : "player-icon-hide")}
                     alt=""
                />

                <img
                    id={"player-icon-vote"}
                    className={this.state.initialVoteState ? "player-icon-default" : (this.props.showVote ? "player-icon-show" : "player-icon-hide")}
                    src={this.props.vote ? YesVote : NoVote}
                    alt={""}
                />

                {identity_components}

                <Textfit id={"player-name"}
                         className={this.getClassName() + " force-update"}
                         mode="multi"
                         forceSingleModeWidth={false}
                         alignVertWithFlexbox={true}
                         throttle={1000}
                >
                    {this.props.name}
                </Textfit>

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
    useAsButton: false,
    isSelected: false,
    onClick: () => {},
    highlight: false,
    showVote: false,
    vote: false,
    icon: "p_default",
};

Player.propTypes = {
    isBusy: PropTypes.bool,
    name: PropTypes.string,
    role: PropTypes.string,
    showRole: PropTypes.bool,
    disabled: PropTypes.bool,
    disabledText: PropTypes.string,
    useAsButton: PropTypes.bool,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    highlight: PropTypes.bool,
    showVote: PropTypes.bool,
    vote: PropTypes.bool,
    icon: PropTypes.string,
};

export default Player;