import React, { ReactElement, useRef, useState } from "react";
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
import { GameState, Role } from "../types";
import { doesHitlerKnowFascists, isVictoryState } from "../utils";

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

const defaultProps: Partial<PlayerDisplayProps> = {
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
export default function PlayerDisplay(
  inputProps: PlayerDisplayProps
): ReactElement {
  const props = {
    ...defaultProps,
    ...inputProps,
  } as Required<PlayerDisplayProps>;

  const [isPlayingVoteAnimation, setIsPlayingVoteAnimation] = useState(false);
  // An array object that maps from each player's position in the order to
  // whether their vote should be shown. This allows the sequence to be animated.
  const [playerVotesVisible, setPlayerVotesVisible] = useState<number>(0);
  /** Timeouts for each player animation. Will be destroyed on reset. */
  const playerVoteAnimations = useRef<NodeJS.Timeout[]>([]);

  /**
   * Returns an array representing the player order.
   * Removes the player if props.includeUser is false.
   */
  const getPlayerOrder = (): string[] => {
    let basePlayers;
    if (props.players === undefined) {
      basePlayers = props.gameState.playerOrder;
    } else {
      basePlayers = props.players;
    }

    if (!props.includeUser) {
      // Remove the user from the players.
      return basePlayers.filter((player) => player !== props.user);
    }
    return basePlayers;
  };

  /**
   * Returns a set of players that should be considered 'busy', which is shown
   * on the UI with a (...) ellipses bubble. A player is considered
   * busy if the game is waiting for some input from them.
   */
  const getBusyPlayerSet = (): Set<string> => {
    const game = props.gameState;
    const busyPlayers = new Set<string>([]);
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
        let playerOrder = getPlayerOrder();
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
  };

  /**
   * @param gameState Current game state
   * @param playerName Name of player to view role for
   * @returns true if the role should be shown; false otherwise.
   */
  const shouldShowRole = (
    gameState: GameState,
    playerName: string
  ): boolean => {
    const myRole = gameState.players[props.user].id;
    const otherRole = gameState.players[playerName].id;

    if (otherRole === undefined) {
      return false;
    }
    if (isVictoryState(gameState.state)) {
      return true;
    }
    if (
      myRole === Role.FASCIST ||
      (myRole === Role.HITLER && doesHitlerKnowFascists(gameState))
    ) {
      // Hide liberal roles, because they can be redundant otherwise.
      return otherRole !== Role.LIBERAL;
    } else {
      return otherRole !== undefined;
    }
  };

  /**
   * Called when the player is selected. Calls props.onSelection if the player is a valid choice.
   * @param name the name of the player.
   * @effects If the player should be disabled (ie, {@code props.playerDisabledFilter(name, gamestate) !== ""}), ignores the selection.
   *          If the player is already selected, ignores the selection.
   *          Otherwise, calls {@code.props.onSelection(name)}.
   */
  const onPlayerSelected = (name: string): void => {
    if (
      props.playerDisabledFilter &&
      props.playerDisabledFilter(name, props.gameState) === "" &&
      props.useAsButtons &&
      name !== props.selection
    ) {
      props.onSelection && props.onSelection(name);
    }
  };

  /**
   * Gets the HTML tags for the players in the provided indices.
   * @param start {int} the starting index, inclusive.
   * @param end {int} the ending index, exclusive.
   * @return {html[]} an array of JSX representing the players in indices {@code start} (inclusive)
   *         to {@code end} (exclusive).
   */
  const renderPlayer = (start: number, end: number): JSX.Element[] => {
    const players = props.gameState.players;
    const playerOrder = getPlayerOrder();
    const busyPlayers = getBusyPlayerSet();

    return playerOrder
      .slice(start, end)
      .map((playerName: string, index: number) => {
        const playerData = players[playerName];

        let roleText = "";
        if (playerName === props.gameState[PARAM_CHANCELLOR]) {
          roleText = "CHANCELLOR";
        } else if (playerName === props.gameState.president) {
          roleText = "PRESIDENT";
        }

        const disabledText = props.playerDisabledFilter!(
          playerName,
          props.gameState
        );
        const disabled = disabledText !== "";

        let label;
        if (props.showLabels) {
          label = <p id="player-display-label">{roleText}</p>;
        }

        const isSelected = props.selection === playerName;
        const onClick = () => {
          onPlayerSelected(playerName);
        };

        // Skip votes for players that are not alive.
        const showVote = index + start < playerVotesVisible && playerData.alive;

        return (
          <div id={"player-display-text-container"} key={playerName}>
            {label}
            <Player
              isBusy={
                busyPlayers.has(playerName) &&
                !props.showVotes &&
                props.showBusy
              } // Do not show while voting.
              role={playerData[PLAYER_IDENTITY]}
              showRole={shouldShowRole(props.gameState, playerName)}
              highlight={playerName === props.user}
              disabled={disabled}
              disabledText={disabledText}
              name={playerName}
              useAsButton={props.useAsButtons}
              isSelected={isSelected}
              onClick={onClick}
              showVote={showVote}
              vote={props.gameState.userVotes[playerName]}
              icon={props.gameState.icon[playerName]}
            />
          </div>
        );
      });
  };

  /**
   * Creates the voting animation sequence.
   */
  const setupVoteAnimation = () => {
    const durationMs = 1000;
    const playerOrder = getPlayerOrder();
    const numVotes = playerOrder.length;
    const timePerPlayerMs = durationMs / numVotes;

    setPlayerVotesVisible(0);
    playerVoteAnimations.current = playerOrder.map((_playerName, index) => {
      return setTimeout(() => {
        setPlayerVotesVisible(index + 1);
      }, (index + 1) * timePerPlayerMs);
    });
  };

  const resetVoteAnimation = () => {
    playerVoteAnimations.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    playerVoteAnimations.current = [];
    setPlayerVotesVisible(0);
  };

  /* Note that there are two player-display-containers, so that the player tiles can be split into two rows if there
   * is insufficient space for them.*/
  const playerOrder = getPlayerOrder();

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

  if (props.showVotes && !isPlayingVoteAnimation) {
    setIsPlayingVoteAnimation(true);
    setupVoteAnimation();
  } else if (!props.showVotes && isPlayingVoteAnimation) {
    setIsPlayingVoteAnimation(false);
    resetVoteAnimation();
  }

  return (
    <div id="player-display">
      <div id="player-display-container">{renderPlayer(0, div1)}</div>
      <div id="player-display-container">{renderPlayer(div1, div2)}</div>
      <div id="player-display-container">
        {renderPlayer(div2, playerOrder.length)}
      </div>
    </div>
  );
}
