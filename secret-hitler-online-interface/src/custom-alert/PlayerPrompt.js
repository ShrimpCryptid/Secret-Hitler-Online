import React, {Component} from 'react';
import PlayerDisplay from "../player/PlayerDisplay";
import {
    PARAM_PLAYERS,
    PLAYER_IS_ALIVE
} from "../GlobalDefinitions";
import OptionPrompt from "./OptionPrompt";
import PropTypes from "prop-types";

/**
 * A PlayerPrompt is the content for an alert box. It has a header, text, and a PlayerList, as well
 * as an associated button.
 */
class PlayerPrompt extends Component{

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined
        }
    }

    render() {
        let props = this.props;
        return (
            <OptionPrompt
                label={props.label}
                headerText={props.headerText}
                renderHeader={props.renderHeader}
                footerText={props.footerText}
                buttonText={props.buttonText}
                buttonDisabled={this.state.selection === undefined || this.props.buttonDisabled}
                buttonOnClick={() => props.buttonOnClick(this.state.selection)}
            >
                <PlayerDisplay
                    gameState = {this.props.gameState}
                    user = {this.props.user}
                    excludeUser = {true}
                    useAsButtons = {true}
                    playerDisabledFilter = {props.disabledFilter}
                    showLabels = {false}
                    selection = {this.state.selection}
                    onSelection = {(itemSelected) => {
                        this.setState({selection: itemSelected});
                    }}
                />
            </OptionPrompt>

        )
    }
}

PlayerPrompt.defaultProps = {
    gameState: {},
    user: "",
    disabledFilter: (name, gameState) => {
        if (gameState[PARAM_PLAYERS][name][!PLAYER_IS_ALIVE]) {
            return "EXECUTED";
        }
        return "";
    },
    buttonText: "CONFIRM",
    buttonOnClick: (selectedItem) => {
        console.log("Button clicked with " + selectedItem + " selected.");
    }
};

PlayerPrompt.propTypes = {
    label: PropTypes.string,
    headerText: PropTypes.string,

    gameState: PropTypes.object,
    user: PropTypes.string,
    disabledFilter: PropTypes.func,

    footerText: PropTypes.string,

    buttonText: PropTypes.string,
    buttonOnClick: PropTypes.func,
};

export default PlayerPrompt;