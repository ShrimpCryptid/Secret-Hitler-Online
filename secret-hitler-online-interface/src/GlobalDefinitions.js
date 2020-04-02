export const LIBERAL = "LIBERAL";
export const FASCIST = "FASCIST";
export const HITLER = "HITLER";

export const PAGE = {
    LOGIN: 'login',
    LOBBY: 'lobby',
    GAME: 'game'
};

export const SERVER_ADDRESS = "192.168.29.242:4000";
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

export const STATE_SETUP = "SETUP";
export const STATE_CHANCELLOR_NOMINATION = "CHANCELLOR_NOMINATION";
export const STATE_CHANCELLOR_VOTING = "CHANCELLOR_VOTING";             // Voting on the chancellor is taking place.
export const STATE_LEGISLATIVE_PRESIDENT = "LEGISLATIVE_PRESIDENT";     // In the legislative phase. The president is selecting a card to discard.
export const STATE_LEGISLATIVE_CHANCELLOR = "LEGISLATIVE_CHANCELLOR";   // In the legislative phase. The chancellor is selecting a card to enact.
export const STATE_LEGISLATIVE_PRESIDENT_VETO = "LEGISLATIVE_PRESIDENT_VETO";       // Chancellor decided to initiate veto, President chooses whether to allow.
export const STATE_PP_PEEK = "PRESIDENTIAL_POWER_PEEK";                 // President may peek at the next three cards in the deck
export const STATE_PP_INVESTIGATE = "PRESIDENTIAL_POWER_INVESTIGATE";   // President can investigate a party membership
export const STATE_PP_EXECUTION = "PRESIDENTIAL_POWER_EXECUTION";       // President may choose a player to execute
export const STATE_PP_ELECTION = "PRESIDENTIAL_POWER_ELECTION";         // President chooses the next president, seat continues as normal after.
export const STATE_POST_LEGISLATIVE = "POST_LEGISLATIVE";               // Waiting for the President to end their turn.
export const STATE_LIBERAL_VICTORY_POLICY = "LIBERAL_VICTORY_POLICY";               // Liberal Party won through enacting Liberal policies.
export const STATE_LIBERAL_VICTORY_EXECUTION = "LIBERAL_VICTORY_EXECUTION";         // Liberal Party won through executing Hitler.
export const STATE_FASCIST_VICTORY_POLICY = "FASCIST_VICTORY_POLICY";               // Fascist Party won through enacting Fascist policies.
export const STATE_FASCIST_VICTORY_ELECTION = "FASCIST_VICTORY_ELECTION";           // Fascist Party won by successfully electing Hitler chancellor.

// Params
// <editor-fold desc="Params">
export const PARAM_IN_GAME = "in-game";

export const PARAM_USER_COUNT = "user-count";
export const PARAM_USERNAMES = "usernames";

export const PARAM_STATE = "state";
export const PARAM_PLAYER_ORDER = "player-order";
export const PARAM_PLAYERS = "players";
export const PLAYER_NAME = "username";
export const PLAYER_IDENTITY = "id";
export const PLAYER_IS_ALIVE = "alive";
export const PLAYER_INVESTIGATED = "investigated";
export const PARAM_PRESIDENT = "president";
export const PARAM_CHANCELLOR = "chancellor";
export const PARAM_LAST_PRESIDENT = "last-president";
export const PARAM_LAST_CHANCELLOR = "last-chancellor";
export const PARAM_ELECTION_TRACKER = "election-tracker";
export const PARAM_VOTES = "user-votes";
export const PARAM_LIBERAL_POLICIES = "liberal-policies";
export const PARAM_FASCIST_POLICIES = "fascist-policies";

// </editor-fold>