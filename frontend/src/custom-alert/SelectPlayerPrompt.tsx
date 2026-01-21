import React, { ReactElement, useEffect, useRef, useState } from "react";
import PlayerDisplayPrompt from "./PlayerDisplayPrompt";
import { SERVER_TIMEOUT } from "../constants";
import {
  DISABLE_EXECUTED_PLAYERS,
  DISABLE_INVESTIGATED_PLAYERS,
  DISABLE_TERM_LIMITED_PLAYERS,
} from "../player/PlayerDisplay";
import { GameState, SendWSCommand, WSCommandType } from "../types";

type AllowedWSCommandTypes =
  | WSCommandType.NOMINATE_CHANCELLOR
  | WSCommandType.REGISTER_EXECUTION
  | WSCommandType.REGISTER_SPECIAL_ELECTION
  | WSCommandType.GET_INVESTIGATION;

type SelectPlayerPromptProps = {
  user: string;
  gameState: GameState;
  sendWSCommand: SendWSCommand;
  commandType: AllowedWSCommandTypes;

  disabledFilter: (name: string, state: GameState) => string; // By default, excludes deceased players
  includeUser: boolean;

  label?: string;
  headerText?: string;
  renderHeader?: () => ReactElement;
  buttonText?: string;
};

const defaultProps: Partial<SelectPlayerPromptProps> = {
  disabledFilter: DISABLE_EXECUTED_PLAYERS,
};

/**
 * A PlayerPrompt that sends a specified server command on the button push and automatically locks the button for a set
 * duration.
 */
export default function SelectPlayerPrompt(
  inputProps: SelectPlayerPromptProps
): ReactElement {
  const props = { ...defaultProps, ...inputProps };

  const timeOutID = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isWaitingForServer, setIsWaitingServer] = useState(false);

  const onButtonClick = (selectedItem: string) => {
    // Lock the button so that it can't be pressed multiple times.
    setIsWaitingServer(true);
    timeOutID.current = setTimeout(() => {
      setIsWaitingServer(false);
    }, SERVER_TIMEOUT);

    props.sendWSCommand({ command: props.commandType, target: selectedItem });
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeOutID.current);
    };
  }, []);

  return (
    <PlayerDisplayPrompt
      label={props.label}
      headerText={props.headerText}
      renderHeader={props.renderHeader}
      gameState={props.gameState}
      disabledFilter={props.disabledFilter}
      buttonText={props.buttonText}
      buttonOnClick={onButtonClick}
      buttonDisabled={isWaitingForServer}
      user={props.user}
      includeUser={props.includeUser}
    />
  );
}

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
export const SelectNominationPrompt = (
  user: string,
  gameState: GameState,
  sendWSCommand: SendWSCommand
): ReactElement => {
  let shouldFascistVictoryWarningBeShown = gameState.fascistPolicies >= 3;

  return (
    <SelectPlayerPrompt
      user={user}
      commandType={WSCommandType.NOMINATE_CHANCELLOR}
      label={"NOMINATION"}
      gameState={gameState}
      sendWSCommand={sendWSCommand}
      renderHeader={() => {
        return (
          <div>
            <p className="left-align">
              Nominate a player to become the next Chancellor.
            </p>
            <p
              className="left-align highlight"
              hidden={!shouldFascistVictoryWarningBeShown}
            >
              Fascists will win if Hitler is nominated and voted in as
              Chancellor!
            </p>
          </div>
        );
      }}
      disabledFilter={DISABLE_TERM_LIMITED_PLAYERS}
      includeUser={false}
    />
  );
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
export const SelectInvestigationPrompt = (
  user: string,
  gameState: GameState,
  sendWSCommand: SendWSCommand
): ReactElement => {
  return (
    <SelectPlayerPrompt
      user={user}
      gameState={gameState}
      sendWSCommand={sendWSCommand}
      commandType={WSCommandType.GET_INVESTIGATION}
      disabledFilter={DISABLE_INVESTIGATED_PLAYERS}
      includeUser={false}
      label={"INVESTIGATE LOYALTY"}
      renderHeader={() => {
        return (
          <>
            <p className={"left-align"}>
              Choose a player and investigate their party alignment. You'll
              learn if the player is a member of the Fascist or Liberal party,
              but not their specific role (e.g., Hitler).
            </p>
            <p className={"left-align"}>
              Players that have been investigated once cannot be investigated
              again.
            </p>
            <p className={"left-align highlight"}>
              (Remember that you can lie about the player's party alignment!)
            </p>
          </>
        );
      }}
    />
  );
};

export const SelectSpecialElectionPrompt = (
  user: string,
  gameState: GameState,
  sendWSCommand: SendWSCommand
): ReactElement => {
  return (
    <SelectPlayerPrompt
      user={user}
      gameState={gameState}
      sendWSCommand={sendWSCommand}
      commandType={WSCommandType.REGISTER_SPECIAL_ELECTION}
      disabledFilter={DISABLE_EXECUTED_PLAYERS}
      includeUser={false}
      label={"SPECIAL ELECTION"}
      headerText={
        "Choose any player to become the next president. Once their term is finished, the order continues as normal."
      }
    />
  );
};

export const SelectExecutionPrompt = (
  user: string,
  gameState: GameState,
  sendWSCommand: SendWSCommand
): ReactElement => {
  return (
    <SelectPlayerPrompt
      user={user}
      gameState={gameState}
      sendWSCommand={sendWSCommand}
      commandType={WSCommandType.REGISTER_EXECUTION}
      disabledFilter={DISABLE_EXECUTED_PLAYERS}
      includeUser={false}
      label={"EXECUTION"}
      renderHeader={() => {
        return (
          <>
            <p className={"left-align"}>
              Choose a player to execute. That player can no longer speak, vote,
              or run for office.
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
