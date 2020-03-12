public enum GameState {
    SETUP,                          // Game is being set up.
    CHANCELLOR_SELECTION,           //
    CHANCELLOR_VOTING,
    LEGISLATIVE_PRESIDENT,          // In the legislative phase. The president is selecting a card to discard.
    LEGISLATIVE_CHANCELLOR,         // In the legislative phase. The chancellor is selecting a card to enact.
    LEGISLATIVE_PRESIDENT_VETO,     // If the chancellor decides to veto the policy agenda
    PRESIDENTIAL_POWER_PEEK,        // President may peek at the next three cards in the deck
    PRESIDENTIAL_POWER_INVESTIGATE, // President can investigate a party membership
    PRESIDENTIAL_POWER_EXECUTION,   // President may choose a player to execute
    PRESIDENTIAL_POWER_ELECTION,    // President chooses the next president, seat continues as normal after.
    LIBERAL_VICTORY_POLICY,
    LIBERAL_VICTORY_EXECUTION,
    FASCIST_VICTORY_POLICY,
    FASCIST_VICTORY_ELECTION
}
