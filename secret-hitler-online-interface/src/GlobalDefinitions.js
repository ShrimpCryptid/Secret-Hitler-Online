export const LIBERAL = "LIBERAL";
export const FASCIST = "FASCIST";
export const HITLER = "HITLER";

export const PAGE = {
    LOGIN: 'login',
    LOBBY: 'lobby',
    GAME: 'game'
};

export const SERVER_ADDRESS = "localhost:4000";
export const SERVER_ADDRESS_HTTP = "http://" + SERVER_ADDRESS;
export const CHECK_LOGIN = "/check-login";
export const NEW_LOBBY = '/new-lobby';
export const WEBSOCKET = '/game';
export const MAX_FAILED_CONNECTIONS = 3;
export const LOBBY_CODE_LENGTH = 6;

//////// Game Constants
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;

//////// JSON Packet Data

// Commands
//<editor-fold desc="Commands">
export const PARAM_COMMAND = "command";
export const PARAM_NAME = "name";
export const PARAM_LOBBY = "lobby";

export const COMMAND_PING = "ping";
export const COMMAND_START_GAME = "start-game";
export const COMMAND_GET_STATE = "get-state";
export const COMMAND_NOMINATE_CHANCELLOR = "nominate-chancellor";
export const COMMAND_REGISTER_VOTE = "register-vote";
export const COMMAND_REGISTER_PRESIDENT_CHOICE = "register-president-choice";
export const COMMAND_REGISTER_CHANCELLOR_CHOICE = "register-chancellor-choice";
export const COMMAND_REGISTER_CHANCELLOR_VETO = "chancellor-veto";
export const COMMAND_REGISTER_PRESIDENT_VETO = "president-veto";
export const COMMAND_REGISTER_EXECUTION = "register-execution";
export const COMMAND_REGISTER_SPECIAL_ELECTION = "register-special-election";
export const COMMAND_GET_INVESTIGATION = "get-investigation";
export const COMMAND_GET_PEEK = "get-peek";
export const COMMAND_END_TERM = "end-term";

//</editor-fold>

// Params
// <editor-fold desc="Params">
export const PARAM_IN_GAME = "in-game";

export const PARAM_USER_COUNT = "user-count";
export const PARAM_USERNAMES = "usernames";

export const PARAM_STATE = "state";
export const PARAM_PLAYERS = "players";
export const PLAYER_NAME = "username";
export const PLAYER_IDENTITY = "identity";
export const PLAYER_IS_ALIVE = "alive";
export const PLAYER_INVESTIGATED = "investigated";

// </editor-fold>