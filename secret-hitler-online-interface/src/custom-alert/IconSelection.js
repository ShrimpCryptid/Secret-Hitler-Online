import React, {Component} from "react";
import "../selectable.css";
import "./IconSelection.css";

import portraits, {defaultPortraits, premiumPortraits} from "../assets";
import {portraitsAltText} from "../assets";

import {
    COMMAND_SELECT_ICON,
    PARAM_ICON,
    PLAYER_ICON,
    SERVER_TIMEOUT,
    PARAM_PLAYERS,
    PARAM_PLAYER_ORDER
} from "../GlobalDefinitions";
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

class IconSelection extends Component {

    timeoutID;

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined,
            waitingForServer: false,
            unlockPremium: false
        };
        this.onButtonClick = this.onButtonClick.bind(this);
        this.getIconButtonHML = this.getIconButtonHML.bind(this);
        this.isIconInUse = this.isIconInUse.bind(this);
        this.onClickUnlock = this.onClickUnlock.bind(this);
    }

    /**
     * Called when any icon is clicked.
     * @effects Attempts to send the server a command with the player's vote, and locks access to the button
     *          for {@code SERVER_TIMEOUT} ms.
     */
    onButtonClick(id) {
        // Lock the button so that it can't be pressed multiple times.
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);
        this.setState({waitingForServer: true});

        // Contact the server using provided method.
        let data = {};
        data[PARAM_ICON] = id; // portrait id.
        this.props.sendWSCommand(COMMAND_SELECT_ICON, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID)
    }

    isIconInUse(iconID) {
        let playerOrder = this.props.gameState[PARAM_PLAYER_ORDER];
        for (let i = 0; i < playerOrder.length; i++) {
            let player = playerOrder[i];
            if (this.props.gameState[PARAM_PLAYERS][player][PARAM_ICON] === iconID) {
                return true;
            }
        }
        return false;
    }

    onClickIcon(iconID) {
        // Verify that player is able to select this icon.
        let currPortrait = this.props.gameState[PARAM_PLAYERS][this.props.user][PLAYER_ICON];
        let isPremium = premiumPortraits.indexOf(iconID) !== -1;
        // Also does not allow selection if user has already selected this icon
        let unselectable = ((isPremium && !this.state.unlockPremium) || (this.isIconInUse(iconID)));

        if (!unselectable) { // This is a valid choice according to our current game state
            // Register the selection with the server.
            // Contact the server using provided method.
            let data = {};
            data[PARAM_ICON] = iconID;
            this.props.sendWSCommand(COMMAND_SELECT_ICON, data);
            console.log("Sending command for icon " + iconID);
        }
    }

    onClickUnlock() {
        this.setState({unlockPremium: true})
    }

    getIconButtonHML(premium) {
        let portraitNames;
        if (premium) {
            portraitNames = premiumPortraits;
        } else {
            portraitNames = defaultPortraits;
        }

        let iconHTML = [];
        // Update selections based on game state given by the server (this prevents duplicate player icons).

        //let currPortrait = this.props.gameState[PARAM_PLAYERS][this.props.user][PLAYER_ICON];
        let currPortrait = "p1";

        portraitNames.forEach(portraitID => {
            // Check if valid portrait name
            if (portraits.hasOwnProperty(portraitID)) {
                // Disable premium icons or icons currently selected by other players.
                let isDisabled = (premium && !this.state.unlockPremium) || (this.isIconInUse(portraitID) && portraitID !== currPortrait);
                let isSelected = currPortrait === portraitID;
                iconHTML.push(
                    <img id={"icon"}
                         className={"selectable"
                                        + (isSelected ? " selected" : "")
                                        + (isDisabled ? " disabled" : "")} // Determines if this should be selected
                         alt={portraitsAltText[portraitID]}
                         src={portraits[portraitID]}
                         draggable={false}
                         onClick={()=>this.onClickIcon(portraitID)}
                    >
                    </img>
                );
            }
        });

        // Return all the icons in a div container.
        return (
            <div id={"icon-container"}>
                {iconHTML}
            </div>
        );
    }

    render() {
        return (
            <ButtonPrompt
                label={"PLAYER LOOK"}
                renderHeader={ () => {
                    return(
                        <>
                            <p>Choose a look, then press confirm.</p>
                            {this.getIconButtonHML(false)}
                        </>
                    );
                } }
                renderFooter={ () => {
                    return (
                        <>
                            <h2 style={{textAlign:"left"}}>Extras:</h2>
                            <div id={"premium-text-container"}>
                                <p id={"icon-text"} style={{textAlign:"left"}}>Unlock these extra icons by sharing this website with your friends or online! I really
                                    want more people to enjoy this game, so this would be a big help.<br/><br/>
                                    (Note: I have literally no way to enforce this, so please use the honor system!)</p>
                                <button style={{height:"100%"}} onClick={this.onClickUnlock}>DONE!</button>
                            </div>
                            <textarea id="linkText" readOnly={true} onClick={()=>document.getElementById("linkText").select()}
                                      value={"https://secret-hitler.online"}/>
                            <br/> <br/>
                            {this.getIconButtonHML(true)}
                        </>
                    );
                }}
                buttonDisabled={this.state.selection === undefined || this.state.waitingForServer}
                buttonOnClick={this.onButtonClick}
            >
            </ButtonPrompt>
        )
    }

}

IconSelection.defaultProps = {
    gameState: {"chancellor": "default"}
};

IconSelection.propTypes = {
    gameState: PropTypes.object.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
    user: PropTypes.string.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default IconSelection;