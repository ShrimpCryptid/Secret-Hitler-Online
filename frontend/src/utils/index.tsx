import { GameState, LobbyState } from "../types";

export const isVictoryState = (lobbyState: LobbyState): boolean => {
  return (
    lobbyState === LobbyState.FASCIST_VICTORY_ELECTION ||
    lobbyState === LobbyState.FASCIST_VICTORY_POLICY ||
    lobbyState === LobbyState.LIBERAL_VICTORY_EXECUTION ||
    lobbyState === LobbyState.LIBERAL_VICTORY_POLICY
  );
};

/**
 * Returns true if players with the Hitler role should know which players have
 * the Fascist role.
 */
export const doesHitlerKnowFascists = (gameState: GameState): boolean => {
  return gameState.playerOrder.length <= 6;
};
