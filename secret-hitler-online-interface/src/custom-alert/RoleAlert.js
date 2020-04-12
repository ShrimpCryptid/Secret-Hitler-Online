import React, {Component} from 'react';
import PropTypes from "prop-types";
import RoleHitler from "../assets/role-hitler.png";
import RoleLiberal1 from "../assets/role-liberal-1.png"
import RoleLiberal2 from "../assets/role-liberal-2.png"
import RoleLiberal3 from "../assets/role-liberal-3.png"
import RoleLiberal4 from "../assets/role-liberal-4.png"
import RoleLiberal5 from "../assets/role-liberal-5.png"
import RoleLiberal6 from "../assets/role-liberal-6.png"
import RoleFascist1 from "../assets/role-fascist-1.png"
import RoleFascist2 from "../assets/role-fascist-2.png"
import RoleFascist3 from "../assets/role-fascist-3.png"

import './RoleAlert.css';
import {FASCIST, HITLER, LIBERAL, PARAM_PLAYER_ORDER, PARAM_PLAYERS, PLAYER_IDENTITY} from "../GlobalDefinitions";

const LiberalImages = [RoleLiberal1, RoleLiberal2, RoleLiberal3, RoleLiberal4, RoleLiberal5, RoleLiberal6];
const LiberalImagesAltText = [  "Your secret role is LIBERAL. The card shows a bespectacled man with a pipe giving a side-eye.",
                                "Your secret role is LIBERAL. The card shows an elegant woman with curly hair and pearls.",
                                "Your secret role is LIBERAL. The card shows a round-chinned man in a pilgrim-esque hat gazing quizzically at the camera.",
                                "Your secret role is LIBERAL. The card shows a sharp-suited man sporting a fedora and a neatly-trimmed mustache.",
                                "Your secret role is LIBERAL. The card shows an elderly woman with comically large glasses holding a chihuahua.",
                                "Your secret role is LIBERAL. The card shows a woman with a large sun hat and shoulder-length bob smirking."];
const HitlerImages = [RoleHitler];
const HitlerImagesAltText = ["Your secret role is HITLER. The card shows a crocodile in a suit and WW2 German military hat glaring at the camera."];
const FascistImages = [RoleFascist1, RoleFascist2, RoleFascist3];
const FascistImagesAltText = [  "Your secret role is FASCIST. The card shows a snake emerging from a suit covered in military medals.",
                                "Your secret role is FASCIST. The card shows an iguana in a German military hat and suit with fangs bared.",
                                "Your secret role is FASCIST. The card shows an iguana in a German military hat and suit with fangs bared.",];

const LiberalText = ["You win if the board fills with liberal policies, or if Hitler is executed.",
                     "You lose if the board fills with fascist policies, or if Hitler is elected chancellor after 3 fascist policies are passed.",
                     "Keep your eyes open and look for suspicious actions. Suss out Hitler, and remember that anyone might be lying!"];
const FascistText = ["You win if Hitler is successfully elected chancellor once 3 fascist policies are on the board, or if the board fills with fascist policies.",
    "You lose if the board fills with liberal policies or if Hitler is executed.",
    "Keep suspicion off of Hitler and look for ways to throw confusion into the game."];
const HitlerText = ["You win if you are successfully elected chancellor once 3 fascist policies are on the board, or if the board fills with fascist policies.",
    "You lose if the board fills with liberal policies or if you are executed.",
    "Try to gain trust and rely on the other fascists to open opportunities for you."];

/**
 * CustomAlert content that shows the player's current role and a quick guide on how to play
 * the game.
 * Parameters:
 *      - {@code role} [String]: The role of the player. Should be either LIBERAL, FASCIST, or HITLER.
 *      - {@code roleID} [int]: The integer roleID of the player. This is used to show unique role cards.
 *          The roleID can range from [1, 6] for LIBERALS, [1, 3] for FASCISTS, and [1] for HITLER. If out of bounds,
 *          the value is set to 1 (default).
 *      - {@code onClick} [()]: The callback function for when confirmation button ("OKAY") is pressed.
 */
class RoleAlert extends Component {

    getRoleImage() {
        let imageArray;
        switch (this.props.role) {
            case "LIBERAL":
                imageArray = LiberalImages;
                break;
            case "FASCIST":
                imageArray = FascistImages;
                break;
            default:
                imageArray = HitlerImages;
        }
        let roleID = this.getRoleID();
        if (roleID >= imageArray.length ||roleID < 0) {
            return imageArray[0];
        }
        return imageArray[roleID];
    }

    /**
     * Gets the value at an index of an array, defaulting if the value is too large or small.
     * @param array the array to get data from.
     * @param index the index of the data in the array.
     * @return if 0 < index < array.length, returns array[index].
     *         Otherwise, returns array[0].
     */
    getIndexWithDefault(array, index) {
        if (index >= array.length || index < 0) {
            return array[0];
        } else {
            return array[index];
        }
    }

    /**
     * Determine the role ID of the player.
     * @return the number of players with the same role that appear before the player. Otherwise, defaults to 0.
     */
    getRoleID() {
        // Determine the role ID of the player by traversing the array of players.
        // The roleID is the number of players with the same role that appear
        // before the user.
        let roleCounts = {"FASCIST": 0, "HITLER": 0, "LIBERAL": 0};
        let roleID = roleCounts[FASCIST];
        if (this.props.gameState !== undefined && this.props.name !== undefined) {
            let game = this.props.gameState;
            let name = this.props.name;
            for (let i = 0; i < game[PARAM_PLAYER_ORDER].length; i++) {
                let currName = game[PARAM_PLAYER_ORDER][i];
                if (currName === name) {
                    roleID = roleCounts[game[PARAM_PLAYERS][name][PLAYER_IDENTITY]];
                    break;
                } else {
                    roleCounts[game[PARAM_PLAYERS][currName][PLAYER_IDENTITY]] += 1;
                }
            }
        }
        return roleID;
    }

    getRoleImageAltText() {
        let roleID = this.getRoleID();

        switch (this.props.role) {
            case LIBERAL:
                return this.getIndexWithDefault(LiberalImagesAltText, roleID);
            case FASCIST:
                return this.getIndexWithDefault(FascistImagesAltText, roleID);
            case HITLER:
                return this.getIndexWithDefault(HitlerImagesAltText, roleID);
            default:
                return this.getIndexWithDefault(HitlerImagesAltText, roleID);

        }
    }

    getHeader() {
        return "YOU ARE: " + this.props.role;
    }

    render() {
        let roleText = HitlerText;
        if (this.props.role === FASCIST) {
            roleText = FascistText;
        } else if (this.props.role === LIBERAL) {
            roleText = LiberalText;
        }
        return (
            <div>
                <div>
                    <h2 id="alert-header" className={"left-align"}>YOU ARE: {this.props.role}</h2>
                    <img id="role" src={this.getRoleImage()} alt={this.getRoleImageAltText()}/>

                    <p className={"left-align"}>{roleText[0]}</p>
                    <p className={"left-align"}>{roleText[1]}</p>
                    <p className="highlight left-align">{roleText[2]}</p>
                </div>
                <p>You can review this later by clicking Your Role below.</p>
                <button onClick={this.props.onClick}>OKAY</button>
            </div>
        );
    }
}

RoleAlert.defaultProps = {
    role: "HITLER",
    name: undefined,
    gameState: undefined
};

RoleAlert.propTypes = {
    role: PropTypes.string.isRequired,
    name: PropTypes.string,
    gameState: PropTypes.object,
    onClick: PropTypes.func.isRequired,
};

export default RoleAlert;