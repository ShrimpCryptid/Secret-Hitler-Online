import { PolicyType, Role } from "./game";

export enum LobbyState {
  SETUP = "SETUP",
  CHANCELLOR_NOMINATION = "CHANCELLOR_NOMINATION",
  CHANCELLOR_VOTING = "CHANCELLOR_VOTING", // Voting on the chancellor is taking place.
  LEGISLATIVE_PRESIDENT = "LEGISLATIVE_PRESIDENT", // In the legislative phase. The president is selecting a card to discard.
  LEGISLATIVE_CHANCELLOR = "LEGISLATIVE_CHANCELLOR", // In the legislative phase. The chancellor is selecting a card to enact.
  LEGISLATIVE_PRESIDENT_VETO = "LEGISLATIVE_PRESIDENT_VETO", // Chancellor decided to initiate veto, President chooses whether to allow.
  PP_PEEK = "PRESIDENTIAL_POWER_PEEK", // President may peek at the next three cards in the deck
  PP_INVESTIGATE = "PRESIDENTIAL_POWER_INVESTIGATE", // President can investigate a party membership
  PP_EXECUTION = "PRESIDENTIAL_POWER_EXECUTION", // President may choose a player to execute
  PP_ELECTION = "PRESIDENTIAL_POWER_ELECTION", // President chooses the next president, seat continues as normal after.
  POST_LEGISLATIVE = "POST_LEGISLATIVE", // Waiting for the President to end their turn.
  LIBERAL_VICTORY_POLICY = "LIBERAL_VICTORY_POLICY", // Liberal Party won through enacting Liberal policies.
  LIBERAL_VICTORY_EXECUTION = "LIBERAL_VICTORY_EXECUTION", // Liberal Party won through executing Hitler.
  FASCIST_VICTORY_POLICY = "FASCIST_VICTORY_POLICY", // Fascist Party won through enacting Fascist policies.
  FASCIST_VICTORY_ELECTION = "FASCIST_VICTORY_ELECTION", // Fascist Party won by successfully electing Hitler chancellor.
}

export type PlayerState = {
  id?: Role;
  alive: boolean;
  investigated: boolean;
};

// TODO: Edit server API so that fields match
export type GameState = {
  state: LobbyState;
  lastState: LobbyState;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  id: string;
  alive: boolean;
  investigated: boolean;
  chancellor: string;
  president: string;
  lastChancellor: string;
  lastPresident: string;
  electionTracker: number;
  electionTrackerAdvanced: boolean;
  userVotes: boolean[];
  liberalPolicies: number;
  fascistPolicies: number;
  drawSize: number;
  discardSize: number;
  presidentChoices: PolicyType[];
  chancellorChoices: PolicyType[];
  targetUser: string;
  lastPolicy: string;
  vetoOccurred: boolean;
};
