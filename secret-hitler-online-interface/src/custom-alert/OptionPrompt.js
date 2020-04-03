import React, {Component} from 'react';
import PlayerDisplay from "../player/PlayerDisplay";
import {
    PARAM_FASCIST_POLICIES,
    PARAM_LAST_CHANCELLOR,
    PARAM_LAST_PRESIDENT,
    PARAM_PLAYERS,
    PLAYER_IS_ALIVE
} from "../GlobalDefinitions";

/**
 * A template set of contents for the CustomAlert class that holds a series of selectable options.
 */
class OptionPrompt extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined
        }
    }

    /**
     * Returns the label for the prompt.
     * @return {String} the string label for the prompt.
     */
    getLabel() {
        return "LABEL HERE";
    }

    /**
     * Gets an array of HTML tags for the header text that appear before the options.
     * @return {[]} an array of HTML tags to render for the header.
     */
    renderHeader() {
        let out = [];
        out[0] = (
            <p>Header goes here.</p>
        );
        return out;
    }

    /**
     * Called when the options change.
     * @param option the value representing the option.
     * @effects sets the state so that this option is selected.
     */
    onOptionSelected(option) {
        this.setState({
            selection:option
        });
    }

    /**
     * Gets the HTML options (interactible objects).
     * @return {[]} an array of HTML tags to render the options.
     */
    renderOptions() {
        let out = [];
        out[0] = (
            <p>Options go here.</p>
        );
        return out;
    }

    /**
     * Gets an array of HTML tags for the footer text that appears after the options.
     * @return {[]} an array of HTML tags used to render the footers (below the options).
     */
    renderFooter() {
        let out = [];
        out[0] = (
            <p>Footer goes here.</p>
        );
        return out;
    }

    /**
     * Gets the label for the button.
     * @return {String} the label to display on the button.
     */
    getButtonLabel() {
        return "CONFIRM"
    }

    /**
     * Determines if the button should be enabled.
     * @return {boolean} returns true if the button should be enabled.
     */
    shouldButtonBeEnabled() {
        return this.state.selection !== undefined;
    }

    /**
     * Called when the button is clicked.
     */
    onButtonClick();

    /**
     *
     * @return {*}
     */
    renderButton() {
        return (
            <button
                disabled={!this.shouldButtonBeEnabled()}
                onClick={this.onButtonClick}
            >
                {this.getButtonLabel()}
            </button>
        )
    }


    render() {
        return (
            <div>
                <h2 className={"left-align"}>{this.getLabel()}</h2>
                {this.renderHeader()}
                {this.renderOptions()}
                {this.renderFooter()}
                {this.renderButton()}
            </div>
        );
    }
}

export default OptionPrompt;