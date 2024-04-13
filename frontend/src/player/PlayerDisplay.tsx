import React, { Component } from "react";
import Player from "./Player";
import {
  PLAYER_IDENTITY,
  PARAM_CHANCELLOR,
  PARAM_STATE,
  STATE_CHANCELLOR_NOMINATION,
  STATE_LEGISLATIVE_PRESIDENT,
  STATE_LEGISLATIVE_PRESIDENT_VETO,
  STATE_PP_PEEK,
  STATE_PP_ELECTION,
  STATE_PP_EXECUTION,
  STATE_PP_INVESTIGATE,
  STATE_POST_LEGISLATIVE,
  STATE_LEGISLATIVE_CHANCELLOR,
  STATE_CHANCELLOR_VOTING,
} from "../constants";
import "./PlayerDisplay.css";
import { GameState } from "../types";

// <editor-fold desc="Player Filters">

export const DISABLE_NONE = () => {
  return "";
};

/**
 * Filter to disable only executed players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "" otherwise.
 */
export const DISABLE_EXECUTED_PLAYERS = (
  name: string,
  gameState: GameState
) => {
  if (!gameState.players[name].alive) {
    return "EXECUTED";
  }
  return "";
};

/**
 * Filter to disable executed and investigated players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "INVESTIGATED" if the player has been investigated,
 *                  "" otherwise.
 */
export const DISABLE_INVESTIGATED_PLAYERS = (
  name: string,
  gameState: GameState
) => {
  if (!gameState.players[name].alive) {
    return "EXECUTED";
  } else if (gameState.players[name].investigated) {
    return "SEARCHED";
  }
  return "";
};

/**
 * Filter to disable executed and investigated players.
 * @param name the name of the player
 * @param gameState the current game state.
 * @return {string} "EXECUTED" if the player is not alive,
 *                  "TERM LIMITED" if the player is-term limited
 *                  (the last elected chancellor and, if >5 players, the last elected president.)
 *                  "" otherwise.
 */
export const DISABLE_TERM_LIMITED_PLAYERS = (
  name: string,
  gameState: GameState
) => {
  // Count number of living players
  let livingPlayers = 0;
  for (let playerIndex in gameState.playerOrder) {
    let playerName = gameState.playerOrder[playerIndex];
    if (gameState.players[playerName].alive) {
      livingPlayers++;
    }
  }

  if (!gameState.players[name].alive) {
    return "EXECUTED";
  } else if (gameState.lastChancellor === name) {
    return "TERM LIMITED";
  } else if (gameState.lastPresident === name && livingPlayers > 5) {
    return "TERM LIMITED";
  } else {
    return "";
  }
};

// </editor-fold>

type PlayerDisplayProps = {
  user: string;
  gameState: GameState;
  players?: string[];
  playerDisabledFilter?: (playerName: string, gameState: GameState) => string;
  onSelection?: (playerName: string) => void;
  selection?: string;
  useAsButtons?: boolean;
  showVotes?: boolean;
  showLabels?: boolean;
  showRoles?: boolean;
  showBusy?: boolean;
  includeUser?: boolean;
};

const defaultPlayerProps: Partial<PlayerDisplayProps> = {
  playerDisabledFilter: DISABLE_EXECUTED_PLAYERS,
  useAsButtons: false,
  includeUser: true,
  showVotes: false,
  showRoles: false,
  showLabels: true,
};

/**
 * Displays a row of player icons and handles displaying busy status, votes, and roles where applicable.
 */
class PlayerDisplay extends React.Component<PlayerDisplayProps> {
  // A map from the role to a boolean value determining if it should be shown.
  playingVoteAnimation = false;
  // An array object that maps from each player's position in the order to
  // whether their vote should be shown. This allows the sequence to be animated.
  showPlayerVote = new Array(10).fill(false);

  // TODO: delete this
  static defaultProps: {
    playerDisabledFilter: (
      name: string,
      gameState: GameState
    ) => "EXECUTED" | "";
    useAsButtons: boolean;
    includeUser: boolean;
    showVotes: boolean;
    showRoles: boolean;
    showLabels: boolean;
  };

  constructor(props: PlayerDisplayProps) {
    super(props);

    this.onPlayerSelected = this.onPlayerSelected.bind(this);
    this.setupVoteAnimation = this.setupVoteAnimation.bind(this);
    this.resetVoteAnimation = this.resetVoteAnimation.bind(this);
  }

  /**
   * Returns a set of players that should be considered 'busy' and marked on the interface. A player is considered
   * busy if the game is waiting for some input from them.
   */
  getBusyPlayerSet() {
    let game = this.props.gameState;
    let busyPlayers = new Set<string>([]);
    switch (game[PARAM_STATE]) {
      case STATE_CHANCELLOR_NOMINATION:
      case STATE_LEGISLATIVE_PRESIDENT:
      case STATE_LEGISLATIVE_PRESIDENT_VETO:
      case STATE_PP_PEEK:
      case STATE_PP_ELECTION:
      case STATE_PP_EXECUTION:
      case STATE_PP_INVESTIGATE:
      case STATE_POST_LEGISLATIVE:
        busyPlayers.add(game.president);
        break;
      case STATE_LEGISLATIVE_CHANCELLOR:
        busyPlayers.add(game[PARAM_CHANCELLOR]);
        break;
      case STATE_CHANCELLOR_VOTING:
        let playerOrder = this.getPlayerOrder();
        let i = 0;
        for (i; i < game.playerOrder.length; i++) {
          let name = playerOrder[i];
          let isAlive = game.players[name].alive;
          if (!game.userVotes.hasOwnProperty(name) && isAlive) {
            // player has not voted (is not in the map of votes) and is alive
            busyPlayers.add(name);
          }
        }

        break;
      default: // This includes the victory states and setup.
        break;
    }
    return busyPlayers;
  }

  /**
   * Returns an array representing the player order. Removes the player if this.props.includeUser is false.
   */
  getPlayerOrder() {
    let basePlayers;
    if (this.props.players === undefined) {
      basePlayers = this.props.gameState.playerOrder;
    } else {
      basePlayers = this.props.players;
    }

    if (!this.props.includeUser) {
      // Remove the user from the players.
      return basePlayers.filter((player) => player !== this.props.user);
    }
    return basePlayers;
  }

  /**
   * Gets the HTML tags for the players in the provided indices.
   * @param start {int} the starting index, inclusive.
   * @param end {int} the ending index, exclusive.
   * @return {html[]} an array of html tags representing the players in indices {@code start} (inclusive)
   *         to {@code end} (exclusive).
   */
  getPlayerHTML(start: number, end: number) {
    let out = [];
    let players = this.props.gameState.players;
    let playerOrder = this.getPlayerOrder();
    let busyPlayers = this.getBusyPlayerSet();
    let i = 0;
    for (i; start + i < end; i++) {
      let index = i + start;
      let playerName = playerOrder[index];

      if (!players.hasOwnProperty(playerName)) {
        continue;
      }
      let playerData = players[playerName];

      let roleText = "";
      if (playerName === this.props.gameState[PARAM_CHANCELLOR]) {
        roleText = "CHANCELLOR";
      } else if (playerName === this.props.gameState.president) {
        roleText = "PRESIDENT";
      }

      let disabledText = this.props.playerDisabledFilter!(
        playerName,
        this.props.gameState
      );
      let disabled = disabledText !== "";

      let label;
      if (this.props.showLabels) {
        label = <p id="player-display-label">{roleText}</p>;
      }

      let isSelected = this.props.selection === playerName;
      let onClick = () => {
        this.onPlayerSelected(playerName);
      };
      out[i] = (
        <div id={"player-display-text-container"} key={playerName}>
          {label}
          <Player
            isBusy={
              busyPlayers.has(playerName) &&
              !this.props.showVotes &&
              this.props.showBusy
            } // Do not show while voting.
            role={playerData[PLAYER_IDENTITY]}
            showRole={playerData[PLAYER_IDENTITY] !== undefined}
            highlight={playerName === this.props.user}
            disabled={disabled}
            disabledText={disabledText}
            name={playerName}
            useAsButton={this.props.useAsButtons}
            isSelected={isSelected}
            onClick={onClick}
            showVote={this.showPlayerVote[i + start]}
            vote={this.props.gameState.userVotes[playerName]}
            icon={this.props.gameState.icon[playerName]}
          />
        </div>
      );
    }
    return out;
  }

  /**
   * Called when the player is selected. Calls this.props.onSelection if the player is a valid choice.
   * @param name the name of the player.
   * @effects If the player should be disabled (ie, {@code this.props.playerDisabledFilter(name, gamestate) !== ""}), ignores the selection.
   *          If the player is already selected, ignores the selection.
   *          Otherwise, calls {@code.this.props.onSelection(name)}.
   */
  onPlayerSelected(name: string) {
    if (
      this.props.playerDisabledFilter &&
      this.props.playerDisabledFilter(name, this.props.gameState) === "" &&
      this.props.useAsButtons &&
      name !== this.props.selection
    ) {
      this.props.onSelection && this.props.onSelection(name);
    }
  }

  /**
   * Creates the voting animation sequence.
   */
  setupVoteAnimation() {
    let duration = 1000;
    let playerOrder = this.getPlayerOrder();
    let numVotes = playerOrder.length;
    let timePerPlayer = duration / numVotes;
    let players = this.props.gameState.players;
    let delay = 0;
    for (let i = 0; i < playerOrder.length; i++) {
      this.showPlayerVote[i] = false;
      let playerName = playerOrder[i];
      if (players[playerName].alive) {
        // player is eligible to vote
        setTimeout(() => {
          this.showPlayerVote[i] = true;
          this.forceUpdate();
          i++;
        }, delay);
        delay += timePerPlayer;
      } else {
        setTimeout(() => {
          this.showPlayerVote[i] = false;
          i++;
        }, delay);
      }
    }
  }

  resetVoteAnimation() {
    this.showPlayerVote = new Array(10).fill(false);
  }

  /* Note that there are two player-display-containers, so that the player tiles can be split into two rows if there
   * is insufficient space for them.*/
  render() {
    let playerOrder = this.getPlayerOrder();
    // divides the playerOrder at the given index to allow for even groupings if the page is too narrow to fit
    // all players.
    let div1, div2;
    if (playerOrder.length <= 4) {
      // all players can be sorted into the first group.
      div1 = playerOrder.length;
      div2 = playerOrder.length;
    } else if (playerOrder.length <= 8) {
      // divide the players into two groups, with size preference given to the second group.
      div1 = Math.floor(playerOrder.length / 2);
      div2 = playerOrder.length;
    } else {
      div1 = Math.floor(playerOrder.length / 3);
      div2 = Math.floor((playerOrder.length * 2) / 3);
    }

    if (this.props.showVotes && !this.playingVoteAnimation) {
      this.playingVoteAnimation = true;
      this.setupVoteAnimation();
    } else if (!this.props.showVotes && this.playingVoteAnimation) {
      this.playingVoteAnimation = false;
      this.resetVoteAnimation();
    }

    return (
      <div id="player-display">
        <div id="player-display-container">{this.getPlayerHTML(0, div1)}</div>
        <div id="player-display-container">
          {this.getPlayerHTML(div1, div2)}
        </div>
        <div id="player-display-container">
          {this.getPlayerHTML(div2, playerOrder.length)}
        </div>
      </div>
    );
  }
}

PlayerDisplay.defaultProps = {
  playerDisabledFilter: DISABLE_EXECUTED_PLAYERS,
  useAsButtons: false,
  includeUser: true,
  showVotes: false,
  showRoles: false,
  showLabels: true,
};

export default PlayerDisplay;
