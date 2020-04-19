import React, {Component} from 'react';
import PropTypes from "prop-types";
import PlayerDisplayPrompt from "./PlayerDisplayPrompt";
import {
    COMMAND_GET_INVESTIGATION,
    COMMAND_NOMINATE_CHANCELLOR, COMMAND_REGISTER_EXECUTION, COMMAND_REGISTER_SPECIAL_ELECTION, PARAM_FASCIST_POLICIES,
    PARAM_TARGET,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";
import {
    DISABLE_EXECUTED_PLAYERS,
    DISABLE_INVESTIGATED_PLAYERS,
    DISABLE_TERM_LIMITED_PLAYERS
} from "../player/PlayerDisplay";

/**
 * A PlayerPrompt that sends a specified server command on the button push and automatically locks the button for a set
 * duration.
 */
class SelectPlayerPrompt extends Component {

    timeOutID;

    constructor(props) {
        super(props);
        this.state = {
            waitingForServer: false,
        };
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick(selectedItem) {
        // Lock the button so that it can't be pressed multiple times.
        this.setState({waitingForServer: true});
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);

        // Contact the server using provided method.
        let data = {};
        data[PARAM_TARGET] = selectedItem;
        this.props.sendWSCommand(this.props.commandType, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID);
    }

    render() {
        let props = this.props;
        return (
            <PlayerDisplayPrompt
                label={props.label}
                headerText={props.headerText}
                renderHeader={props.renderHeader}
                gameState={props.gameState}
                disabledFilter={props.disabledFilter}
                buttonText={props.buttonText}
                buttonOnClick={this.onButtonClick}
                buttonDisabled={this.state.waitingForServer}
                user={props.user}
                includeUser={props.includeUser}
            />
        );
    }
}

SelectPlayerPrompt.defaultProps = {
    disabledFilter: DISABLE_EXECUTED_PLAYERS,
};

SelectPlayerPrompt.propTypes = {
    user: PropTypes.string.isRequired,
    gameState: PropTypes.object.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
    commandType: PropTypes.string.isRequired,

    disabledFilter: PropTypes.func, // By default, excludes deceased players
    includeUser: PropTypes.bool,

    label: PropTypes.string.isRequired,
    headerText: PropTypes.string,
    renderHeader:PropTypes.func,
    buttonText: PropTypes.string,
};

export default SelectPlayerPrompt;

// Definitions for some basic templates.
/**
 * Returns the HTML for the NominationPrompt.
 * @param user {String} the name of the user.
 * @param gameState {Object} the state of the game.
 * @param sendWSCommand {function} the callback function for sending websocket commands.
 * @return {html} the HTML Tag for a SelectPlayerPrompt that requests the player to select a chancellor.
 *         Notably, the prompt disables players that are term-limited, and when the button is pressed sends the
 *         COMMAND_NOMINATE_CHANCELLOR command to the server.
 */
export const SelectNominationPrompt = (user, gameState, sendWSCommand) => {
    let shouldFascistVictoryWarningBeShown = gameState[PARAM_FASCIST_POLICIES] >= 3;

    return (
        <SelectPlayerPrompt
            user={user}
            commandType={COMMAND_NOMINATE_CHANCELLOR}
            label={"NOMINATION"}
            gameState={gameState}
            sendWSCommand={sendWSCommand}
            renderHeader={() => {
                return (
                    <div>
                        <p className="left-align">Nominate a player to become the next Chancellor.</p>
                        <p className="left-align highlight" hidden={!shouldFascistVictoryWarningBeShown}>
                            Fascists will win if Hitler is nominated and voted in as Chancellor!
                        </p>
                    </div>
                )
            }}
            disabledFilter={DISABLE_TERM_LIMITED_PLAYERS}
            includeUser={false}
        />
    )
};

/**
 * Returns the HTML for the InvestigationPrompt.
 * @param user {String} the name of the user.
 * @param gameState {Object} the state of the game.
 * @param sendWSCommand {function} the callback function for sending websocket commands.
 * @return {html} The HTML Tag for a SelectPlayerPrompt that requests the player to select a player to investigate.
 *         The prompt disables players that have been investigated, and when the button is pressed sends the
 *         COMMAND_GET_INVESTIGATION command to the server.
 */
export const SelectInvestigationPrompt = (user, gameState, sendWSCommand) => {
    return (
        <SelectPlayerPrompt
            user={user}
            gameState={gameState}
            sendWSCommand={sendWSCommand}
            commandType={COMMAND_GET_INVESTIGATION}
            disabledFilter={DISABLE_INVESTIGATED_PLAYERS}
            includeUser={false}
            label={"INVESTIGATE LOYALTY"}
            renderHeader={() => {
                return (
                    <>
                        <p className={"left-align"}>
                            Choose a player and investigate their party alignment.
                            You'll learn if the player is a member of the Fascist or Liberal party, but not their specific role (e.g., Hitler).
                        </p>
                        <p className={"left-align"}>
                            Players that have been investigated once cannot be investigated again.
                        </p>
                        <p className={"left-align highlight"}>
                            (Remember that you can lie about the player's party alignment!)
                        </p>
                    </>
                );
            }}
        />
    )
};

export const SelectSpecialElectionPrompt = (user, gameState, sendWSCommand) => {
    return (
        <SelectPlayerPrompt
            user={user}
            gameState={gameState}
            sendWSCommand={sendWSCommand}
            commandType={COMMAND_REGISTER_SPECIAL_ELECTION}
            disabledFilter={DISABLE_EXECUTED_PLAYERS}
            includeUser={true}
            label={"SPECIAL ELECTION"}
            headerText={"Choose any player to become the next president. Once their term is finished, the order continues as normal."}
        />
    );
};

export const SelectExecutionPrompt = (user, gameState, sendWSCommand) => {
    return (
        <SelectPlayerPrompt
            user={user}
            gameState={gameState}
            sendWSCommand={sendWSCommand}
            commandType={COMMAND_REGISTER_EXECUTION}
            disabledFilter={DISABLE_EXECUTED_PLAYERS}
            includeUser={false}
            label={"EXECUTION"}
            renderHeader={() => {
                return (
                    <>
                        <p className={"left-align"}>
                            Choose a player to execute. That player can no longer speak, vote, or run for office.
                        </p>
                        <p className={"left-align highlight"}>
                            The game ends and Liberals win if Hitler is executed.
                        </p>
                    </>
                );
            }}
        />
    );
};