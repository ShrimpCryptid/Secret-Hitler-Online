import React, {Component} from "react";
import ButtonPrompt from "./ButtonPrompt";
import {
    COMMAND_REGISTER_VOTE,
    FASCIST,
    HITLER,
    LIBERAL,
    PARAM_CHANCELLOR,
    PARAM_ELECTION_TRACKER,
    PARAM_FASCIST_POLICIES,
    PARAM_PLAYER_ORDER,
    PARAM_PLAYERS,
    PARAM_PRESIDENT,
    PARAM_VOTE,
    PLAYER_IDENTITY,
    SERVER_TIMEOUT
} from "../GlobalDefinitions";
import "../selectable.css";
import "./VotingPrompt.css";
import YesVote from "../assets/vote-yes.png";
import NoVote from "../assets/vote-no.png";
import Player from "../player/Player";
import PropTypes from "prop-types";

class VotingPrompt extends Component {

    timeoutID;

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined,
            waitingForServer: false
        };
        this.onButtonClick = this.onButtonClick.bind(this);
    }

    /**
     * Returns whether the chancellor's role should be shown on the card.
     * @return {boolean} Returns true iff the chancellor should be shown. This can happen if:
     *          - The player is fascist and the chancellor is fascist/hitler
     *          - The player is hitler, the chancellor is fascist, and there are 5-6 players.
     */
    shouldChancellorRoleBeShown() {
        let game = this.props.gameState;
        let userRole = game[PARAM_PLAYERS][this.props.user][PLAYER_IDENTITY];
        let chancellor = game[PARAM_CHANCELLOR];
        let chancellorRole = game[PARAM_PLAYERS][chancellor][PLAYER_IDENTITY];
        switch (userRole) {
            case LIBERAL:
                return false;
            case FASCIST:
                if (chancellorRole === HITLER || chancellorRole === FASCIST){
                    return true;
                }
                break;
            case HITLER:
                if (chancellorRole === FASCIST && game[PARAM_PLAYER_ORDER].length <= 6) {
                    return true;
                }
                break;
            default:
        }
        return false;
    }

    /**
     * Called when the confirm button is clicked.
     * @effects Attempts to send the server a command with the player's vote, and locks access to the button
     *          for {@code SERVER_TIMEOUT} ms.
     */
    onButtonClick() {
        // Lock the button so that it can't be pressed multiple times.
        this.timeoutID = setTimeout(() => {this.setState({waitingForServer: false})}, SERVER_TIMEOUT);
        this.setState({waitingForServer: true});

        // Contact the server using provided method.
        let data = {};
        data[PARAM_VOTE] = this.state.selection === "yes"; // transform into a boolean value.
        this.props.sendWSCommand(COMMAND_REGISTER_VOTE, data);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutID)
    }

    render() {
        let chancellorName = this.props.gameState[PARAM_CHANCELLOR];
        let shouldShowChancellorRole = this.shouldChancellorRoleBeShown();
        let chancellorRole = this.props.gameState[PARAM_PLAYERS][chancellorName][PLAYER_IDENTITY];
        let presidentName = this.props.gameState[PARAM_PRESIDENT];
        return (
            <ButtonPrompt
                label={"VOTING"}
                renderHeader={ () => {
                        return(
                            <>
                                <Player
                                    id={"voting-player"}
                                    name={chancellorName}
                                    showRole={shouldShowChancellorRole}
                                    role={chancellorRole}
                                />

                                <p className="left-align">
                                    {presidentName + " has nominated "
                                        + chancellorName + " as their chancellor."}
                                </p>
                                <p className="left-align">
                                    {"Vote on whether you want this government to proceed."}
                                </p>
                                <p className="left-align">
                                    {"The vote passes if over 50% of the votes are yes."}
                                </p>

                                {/* These are two optional warnings that appear when player decisions are extra critical,
                                      such as if fascists can win the game or if the voting tracker will hit the end. */}
                                {this.props.gameState[PARAM_FASCIST_POLICIES] >= 3 && <p className="highlight left-align">
                                    {"Fascists will win if Hitler is successfully voted in as chancellor!"}
                                </p>}
                                {this.props.gameState[PARAM_ELECTION_TRACKER] === 2 && <p className="highlight left-align">
                                    {"If this vote fails, the next policy in the draw deck will be immediately enacted."}
                                </p>}
                            </>
                        );
                    } }
                buttonDisabled={this.state.selection === undefined || this.state.waitingForServer}
                buttonOnClick={this.onButtonClick}
            >
                <div id={"voting-card-container"}>
                    <img
                        id={"voting-card"}
                        className={"selectable " + (this.state.selection === "yes" ? "selected " : "")} /*Determines if this should be selected.*/
                        src={YesVote}
                        alt={"Ja! (Yes)"}
                        onClick={()=>this.setState({selection: "yes"})}
                    />
                    <img
                        id={"voting-card"}
                        className={"selectable " + (this.state.selection === "no" ? "selected " : "")}
                        src={NoVote}
                        alt={"Nein (No)"}
                        onClick={()=>this.setState({selection: "no"})}
                    />
                </div>
            </ButtonPrompt>
        )
    }
}

VotingPrompt.defaultProps = {
    gameState: {"chancellor": "default"}
};

VotingPrompt.propTypes = {
    gameState: PropTypes.object.isRequired,
    sendWSCommand: PropTypes.func.isRequired,
    user: PropTypes.string.isRequired
};

export default VotingPrompt;