import React, { Component } from "react";
import ButtonPrompt from "./ButtonPrompt";
import {
  PARAM_CHANCELLOR,
  PARAM_PLAYERS,
  PARAM_PRESIDENT,
  PLAYER_IDENTITY,
  SERVER_TIMEOUT,
} from "../constants";
import "../selectable.css";
import "./VotingPrompt.css";
import YesVote from "../assets/vote-yes.png";
import NoVote from "../assets/vote-no.png";
import Player from "../player/Player";
import { GameState, Role, SendWSCommand, WSCommandType } from "../types";

type VotingPromptProps = {
  gameState: GameState;
  sendWSCommand: SendWSCommand;
  user: string;
};

type VotingPromptState = {
  selection?: string;
  waitingForServer: boolean;
};

class VotingPrompt extends Component<VotingPromptProps, VotingPromptState> {
  timeoutID: NodeJS.Timeout | undefined;

  constructor(props: VotingPromptProps) {
    super(props);
    this.state = {
      selection: undefined,
      waitingForServer: false,
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
      case Role.LIBERAL:
        return false;
      case Role.FASCIST:
        if (chancellorRole === Role.HITLER || chancellorRole === Role.FASCIST) {
          return true;
        }
        break;
      case Role.HITLER:
        if (chancellorRole === Role.FASCIST && game.playerOrder.length <= 6) {
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
    this.timeoutID = setTimeout(() => {
      this.setState({ waitingForServer: false });
    }, SERVER_TIMEOUT);
    this.setState({ waitingForServer: true });

    // Contact the server using provided method.
    this.props.sendWSCommand({
      command: WSCommandType.REGISTER_VOTE,
      vote: this.state.selection === "yes",
    });
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID);
  }

  render() {
    let chancellorName = this.props.gameState[PARAM_CHANCELLOR];
    let shouldShowChancellorRole = this.shouldChancellorRoleBeShown();
    let chancellorRole =
      this.props.gameState[PARAM_PLAYERS][chancellorName][PLAYER_IDENTITY];
    let presidentName = this.props.gameState[PARAM_PRESIDENT];
    return (
      <ButtonPrompt
        label={"VOTING"}
        renderHeader={() => {
          return (
            <>
              <Player
                id={"voting-player"}
                name={chancellorName}
                showRole={shouldShowChancellorRole}
                role={chancellorRole}
                style={{ marginRight: "10px" }}
                icon={this.props.gameState.icon[chancellorName]}
              />

              <p className="left-align">
                {presidentName +
                  " has nominated " +
                  chancellorName +
                  " as chancellor."}
              </p>
              <p className="left-align">
                {
                  "Vote on whether you want this government to proceed; The vote passes if over 50% of the votes are yes."
                }
              </p>

              {/* These are two optional warnings that appear when player decisions are extra critical,
                                      such as if fascists can win the game or if the voting tracker will hit the end. */}
              {this.props.gameState.fascistPolicies >= 3 && (
                <p className="highlight left-align">
                  {
                    "Fascists will win if Hitler is successfully voted in as chancellor!"
                  }
                </p>
              )}
              {this.props.gameState.electionTracker === 2 && (
                <p className="highlight left-align">
                  {
                    "If this vote fails, the next policy in the draw deck will be immediately enacted."
                  }
                </p>
              )}
            </>
          );
        }}
        buttonDisabled={
          this.state.selection === undefined || this.state.waitingForServer
        }
        buttonOnClick={this.onButtonClick}
      >
        <div id={"voting-card-container"}>
          <img
            id={"voting-card"}
            className={
              "selectable " +
              (this.state.selection === "yes" ? "selected " : "")
            } /*Determines if this should be selected.*/
            src={YesVote}
            alt={"Ja! (Yes)"}
            onClick={() => this.setState({ selection: "yes" })}
          />
          <img
            id={"voting-card"}
            className={
              "selectable " + (this.state.selection === "no" ? "selected " : "")
            }
            src={NoVote}
            alt={"Nein (No)"}
            onClick={() => this.setState({ selection: "no" })}
          />
        </div>
      </ButtonPrompt>
    );
  }
}

export default VotingPrompt;
