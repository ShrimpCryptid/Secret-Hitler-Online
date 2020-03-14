public enum GameState {
    SETUP,                          // Game is being set up.
    CHANCELLOR_NOMINATION,          // President is nominating a chancellor.
    CHANCELLOR_VOTING,              // Voting on the chancellor is taking place.
    LEGISLATIVE_PRESIDENT,          // In the legislative phase. The president is selecting a card to discard.
    LEGISLATIVE_CHANCELLOR,         // In the legislative phase. The chancellor is selecting a card to enact.
    LEGISLATIVE_PRESIDENT_VETO,     // Chancellor decided to initiate veto, President chooses whether to allow.
    PRESIDENTIAL_POWER_PEEK,        // President may peek at the next three cards in the deck
    PRESIDENTIAL_POWER_INVESTIGATE, // President can investigate a party membership
    PRESIDENTIAL_POWER_EXECUTION,   // President may choose a player to execute
    PRESIDENTIAL_POWER_ELECTION,    // President chooses the next president, seat continues as normal after.
    POST_LEGISLATIVE,               // Waiting for the President to end their turn.
    LIBERAL_VICTORY_POLICY,         // Liberal Party won through enacting Liberal policies.
    LIBERAL_VICTORY_EXECUTION,      // Liberal Party won through executing Hitler.
    FASCIST_VICTORY_POLICY,         // Fascist Party won through enacting Fascist policies.
    FASCIST_VICTORY_ELECTION        // Fascist Party won by successfully electing Hitler chancellor.
}
