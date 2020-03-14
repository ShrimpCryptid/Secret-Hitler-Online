import datastructures.Deck;
import datastructures.Identity;
import datastructures.Player;
import datastructures.Policy;
import datastructures.board.Board;
import datastructures.board.FiveToSixPlayerBoard;
import datastructures.board.NineToTenPlayerBoard;
import datastructures.board.SevenToEightPlayerBoard;

import java.util.*;

/**
 * Keeps track of the state of a game of Secret Hitler.
 *
 * Secret Hitler is a social deduction game for 5-10 players, originally
 * created by Goat, Wolf & Cabbage (c) 2016. You can find more details on their
 * website, or order the physical game, at https://www.secrethitler.com/.
 *
 * Secret Hitler is licensed through Creative Commons.
 */
public class SecretHitlerGame {

    /////////////////// Static Fields
    //<editor-fold desc="Static Fields">

    // Keeps track of the number of fascists that should be in the game for a given number
    // of players.                                         -   -   -   -   -   5   6   7   8   9  10
    public static final int[] NUM_FASCISTS_FOR_PLAYERS = {-1, -1, -1, -1, -1,  1,  1,  2,  2,  3,  3};

    // The number of fascist and liberal policies in a standard deck.
    public static final int NUM_FASCIST_POLICIES = 11;
    public static final int NUM_LIBERAL_POLICIES = 6;

    public static final int MIN_PLAYERS = 5;
    public static final int MAX_PLAYERS = 10;

    public static final int MAX_FAILED_ELECTIONS = 3;
    private static final float VOTING_CUTOFF = 0.5000001f;
    private static final int MIN_DRAW_DECK_SIZE = 3;

    public static final int PRESIDENT_DRAW_SIZE = 3;
    public static final int CHANCELLOR_DRAW_SIZE = 2;

    //</editor-fold>

    /////////////////// Private Fields
    //<editor-fold desc="Private Fields">

    private List<Player> playerList;
    private Board board;
    private Deck discard;
    private Deck draw;

    private int electionTracker;

    private GameState state;

    private Random random;

    // The last president and chancellor that were successfully voted into office.
    private String lastPresident;
    private String lastChancellor;

    private String currentPresident;
    private String currentChancellor;

    // Used during a session with the PRESIDENTIAL_POWER_ELECTION power active to remember the next president.
    // The default state should be null.
    private String nextPresident;
    // The president that was elected to take power next (due to the PRESIDENTIAL_POWER_ELECTION power being active).
    private String electedPresident;

    // The options available to either the President or the Chancellor during the legislative session
    private List<Policy> legislativePolicies;

    private Map<String, Boolean> voteMap;

    //</editor-fold>

    /////////////////// Public Observers
    //<editor-fold desc="Public Observers">

    public String getCurrentPresident() { return currentPresident; }

    public String getCurrentChancellor() { return currentChancellor; }

    public String getLastPresident() { return lastPresident; }

    public String getLastChancellor() { return lastChancellor; }

    public int getDrawSize() { return draw.getSize(); }

    public int getDiscardSize() { return discard.getSize(); }

    public int getElectionTracker() { return electionTracker; }

    public int getNumFascistPolicies() { return board.getNumFascistPolicies(); }

    public int getNumLiberalPolicies() { return board.getNumLiberalPolicies(); }

    //</editor-fold>

    /////////////////// Constructor
    //<editor-fold desc="Constructor">

    /**
     * Constructs a new game of Secret Hitler.
     * @modifies this
     * @effects this is a new SecretHitlerGame in setup mode with no players.
     */
    public SecretHitlerGame() {
        playerList = new ArrayList<>();
        state = GameState.SETUP;
        random = new Random();
        electionTracker = 0;
    }

    //</editor-fold>

    /////////////////// Player Management
    //<editor-fold desc="Player Management">


    /**
     * Checks if the game has a player with the given username.
     * @param username
     * @return true iff the player is in the game.
     */
    public boolean hasPlayer(String username) {
        for (Player p : playerList) {
            if (p.getUsername().equals(username)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a player to the list of active players.
     * @param username the username of the player to add.
     * @modifies this
     * @effects if 1) the number of players is less than {@code MAX_PLAYERS}, 2) the game is in setup mode, and 3)
     *          there is not already a player with the given username,
     *          adds a new Player with the given username to the list of active players.
     * @return true if the player was successfully added, false otherwise.
     */
    public boolean addPlayer(String username) {
        if (playerList.size() >= MAX_PLAYERS || hasPlayer(username)) {
            return false;
        }
        playerList.add(new Player(username));
        return true;
    }

    /**
     * Gets the list of active players.
     * @return an immutable list of Players.
     */
    public List<Player> getPlayerList() {
        return new ArrayList<>(playerList);
        // TODO: Unfortunately, Player is not immutable, so it's possible for the contents to be changed. ://
    }

    /**
     * Removes a player from the list of active players.
     * @param username
     * @throws IllegalArgumentException if the player is not in the game.
     * @modifies this
     * @effects removes the specified player from the list of active players.
     */
    public void removePlayer(String username) {
        if (!hasPlayer(username)) {
            throw new IllegalArgumentException("Cannot remove player " + username + ": player does not exist.");
        }
        playerList.remove(indexOfPlayer(username));
    }

    /**
     * Gets the index of a player in the list.
     * @param username the username to search for.
     * @return the index of the given player in the list. Returns -1 if the player was not found.
     */
    private int indexOfPlayer(String username) {
        for(int i = 0; i < playerList.size(); i++) {
            if (playerList.get(i).getUsername().equals(username)) {
                return i;
            }
        }
        return -1;
    }

    private Player getPlayer(String username) {
        return playerList.get(indexOfPlayer(username));
    }

    //</editor-fold>

    /////////////////// Game Setup
    //<editor-fold desc="Game Setup">

    /**
     * Starts the game of Secret Hitler.
     * @modifies this
     * @effects initializes the game and
     * @return true if and only if 1) the game is in setup and 2) there are sufficient players.
     */
    public boolean start() {
        if (playerList.size() < MIN_PLAYERS || this.state != GameState.SETUP) {
            return false;
        }
        resetDeck();
        assignRoles();
        electionTracker = 0;

        // Assign a new board based on the number of players.
        if (playerList.size() <= 6) {
            board = new FiveToSixPlayerBoard();
        } else if (playerList.size() <= 8) {
            board = new SevenToEightPlayerBoard();
        } else {
            board = new NineToTenPlayerBoard();
        }

        currentPresident = playerList.get(0).getUsername();
        currentChancellor = null;
        lastChancellor = null;
        lastPresident = null;

        state = GameState.CHANCELLOR_NOMINATION;

        return true;
    }

    /**
     * Resets the Draw and Discard decks.
     * @effects empties the discard deck, fills the draw deck with a standard card count, and shuffles.
     */
    private void resetDeck() {
        draw = new Deck();
        discard = new Deck();

        for (int i = 0; i < NUM_FASCIST_POLICIES; i++) {
            draw.add(new Policy(Policy.Type.FASCIST));
        }
        for (int i = 0; i < NUM_LIBERAL_POLICIES; i++) {
            draw.add(new Policy(Policy.Type.LIBERAL));
        }

        draw.shuffle();
    }

    /**
     * Randomly assigns the player roles.
     * @requires the number of players is between 5 and 10, inclusive.
     * @modifies this
     * @effects all Players in playerList are assigned either LIBERAL, FASCIST, or HITLER.
     *          The number of each is given by the following table:
     *          # players:  5   6   7   8   9   10
     *          # liberals: 3   4   4   5   5   6
     *          # fascists: 1   1   2   2   3   3
     *          # hitler:   1   1   1   1   1   1
     */
    private void assignRoles() {
        int players = playerList.size();
        if (players < MIN_PLAYERS) {
            throw new IllegalStateException("Cannot assign roles with insufficient players.");
        } else if (players > MAX_PLAYERS) {
            throw new IllegalStateException("Cannot assign roles with too many players.");
        }

                                            // 5  6  7  8  9  10
        int[] fascistsFromPlayers = new int[] {1, 1, 2, 2, 3, 3};
        int numFascistsToSet = fascistsFromPlayers[players - MIN_PLAYERS];

        // Set all players to default state
        for (Player player : playerList) {
            player.setIdentity(Identity.LIBERAL);
        }

        //Randomly set one player to be hitler
        int indexOfHitler = random.nextInt(players);
        playerList.get(indexOfHitler).setIdentity(Identity.HITLER);

        while (numFascistsToSet > 0) {
            int randomIndex = random.nextInt(players);
            if (!playerList.get(randomIndex).isFascist()) { //If player has not already been set
                playerList.get(randomIndex).setIdentity(Identity.FASCIST);
                numFascistsToSet--;
            }
        }
    }

    //</editor-fold>

    /////////////////// State Management
    //<editor-fold desc="State Management">


    /**
     * Gets the current state of the SecretHitlerGame.
     * @return a GameState representing the current state of the game.
     */
    public GameState getState() {
        checkIfGameOver();
        return state;
    }

    /**
     * Updates the game state if the game ended by policies.
     * @modifies this
     * @effects sets this.state to the FASCIST_VICTORY_POLICY or LIBERAL_VICTORY_POLICY states if the
     *          win conditions for policies are met.
     */
    private void checkIfGameOver() {
        if(board.isFascistVictory()) {
            state = GameState.FASCIST_VICTORY_POLICY;
        } else if (board.isLiberalVictory()) {
            state = GameState.LIBERAL_VICTORY_POLICY;
        }
    }

    /**
     * Adds the discard deck to the draw deck and shuffles.
     * @modifies this
     * @effects Empties the discard pile into the draw pile and shuffles.
     */
    private void shuffleDiscardIntoDraw() {
        while(!discard.isEmpty()) {
            draw.add(discard.remove());
        }
        draw.shuffle();
    }

    //</editor-fold>

    /////////////////// Nomination and Voting
    //<editor-fold desc="Nomination and Voting">

    /**
     * Selects the chancellor for the current legislation.
     * @param username username of the chancellor to elect.
     * @throws IllegalStateException if the state is not {@code CHANCELLOR_SELECTION}.
     * @throws IllegalArgumentException if the player named {@code username} was one of the last elected officials,
     *         if the player is dead, or if the player does not exist.
     * @modifies this
     * @effects the current chancellor is set to the player named {@code username}. The game state is set to be in
     *          CHANCELLOR_VOTING.
     */
    public void nominateChancellor(String username) {
        if (getState() != GameState.CHANCELLOR_NOMINATION) {
            throw new IllegalStateException("Cannot elect a chancellor now (invalid state).");
        } else if (username.equals(lastChancellor) || username.equals(lastPresident)) {
            throw new IllegalArgumentException("Cannot elect chancellor that was previously in office.");
        } else if (!hasPlayer(username)) {
            throw new IllegalArgumentException("Player " + username + " does not exist.");
        } else if (!getPlayer(username).isAlive()) {
            throw new IllegalArgumentException("Player " + username + " is dead and cannot be elected for chancellor.");
        }

        currentChancellor = username;
        state = GameState.CHANCELLOR_VOTING; // exits the previous state.
        voteMap = new HashMap<>(); // initializes a new map for voting.
    }

    /**
     * Registers a vote for chancellor from a given player.
     * @param username the name of the player giving the vote.
     * @param vote the vote of the player (true = ja, false = nein).
     * @throws IllegalArgumentException if the Player with name {@code username} is not in the game.
     * @throws IllegalStateException if the Player with name {@code username} has already voted, or if the game is not
     *                               in the voting ({@code CHANCELLOR_VOTING}) state.
     * @modifies this
     * @effects registers the given vote. If all players have voted, determines whether the vote passed.
     *          If the vote passed, the state advances to {@code LEGISLATIVE_PRESIDENT}. (unless the chancellor is Hitler
     *          and three fascist policies have been passed, in which case the state advances to {@code FASCIST_VICTORY_ELECTION.}
     *          If the vote did not pass, advances the election tracker by 1. If the election tracker reaches its max,
     *          immediately enacts the top policy on the pile and handles state progression.
     */
    public void registerVote(String username, boolean vote) {
        if(!hasPlayer(username)) {
            throw new IllegalArgumentException("Player " + username +" is not in the game and cannot vote.");
        } else if (voteMap.containsKey(username)) {
            throw new IllegalStateException("Player " + username + " cannot vote twice.");
        } else if (state != GameState.CHANCELLOR_VOTING) {
            throw new IllegalStateException("Player " + username + " cannot vote when a vote is not taking place.");
        }

        voteMap.put(username, vote);

        // Count up votes and check if all votes have been submitted.
        boolean allPlayersHaveVoted = true;
        int totalVotes = 0;
        int totalYesVotes = 0;

        for (Player player : playerList) {
            String playerName = player.getUsername();

            if (player.isAlive()) { // only account for
                if (voteMap.containsKey(playerName)) {
                    totalVotes += 1;
                    if (voteMap.get(playerName)) { // player voted yes
                        totalYesVotes += 1;
                    }
                } else {
                    allPlayersHaveVoted = false; //Player vote not accounted for
                }
            }
        }

        if (allPlayersHaveVoted) {
            if (((float) totalYesVotes / (float) totalVotes) > VOTING_CUTOFF) { // vote passed successfully
                currentChancellor = username;
                if (getPlayer(username).isHitler() && board.fascistsCanWinByElection()) {
                    state = GameState.FASCIST_VICTORY_ELECTION; // Fascists won by electing Hitler: game ends.
                } else {
                    startLegislativeSession();
                }
            } else { // vote failed
                advanceElectionTracker();
            }
        }
    }

    /**
     * Returns a map representing what each player voted.
     * @return a map, where the keys are the usernames and the booleans are the vote (yes/no) of the player.
     */
    public Map<String, Boolean> getVotes() {
        return new HashMap<>(voteMap); // making a copy of the votes so that they cannot be externally modified
    }

    /**
     * Advances the election tracker and enacts a policy if needed.
     * @modifies this
     * @effects If the tracker < 2, advances the tracker by 1.
     *          If the tracker == 2, rests the tracker to 0 and enacts the first policy on the top of the draw pile.
     */
    private void advanceElectionTracker() {
        electionTracker += 1;
        if (electionTracker == MAX_FAILED_ELECTIONS) {
            Policy newPolicy = draw.remove();
            board.enactPolicy(newPolicy);
            // Note that the newPolicy is NOT added back to the discard pile.
            electionTracker = 0; // Reset

            onEnactPolicy();
        } else {
            concludeTerm();
        }
    }

    //</editor-fold>

    /////////////////// President Management
    // <editor-fold desc="President Management">
    /**
     * Called when the president's term is over.
     * @modifies this
     * @effects advances the state to {@code POST_LEGISLATIVE}.
     */
    private void concludeTerm() {
        this.state = GameState.POST_LEGISLATIVE;
    }

    /**
     * Called to end the current's president term.
     * @throws IllegalStateException if the state is not {@code POST_LEGISLATIVE}.
     * @modifies this
     * @effects advances the state to {@code CHANCELLOR_NOMINATION} and updates the current president.
     *          If the PRESIDENTIAL_POWER_ELECTION power was activated, sets the next president to the elected.
     *          If the election round finished, returns to the next player in the normal round ordering.
     *          Otherwise, chooses the next eligible (alive) player in the ordering to become president.
     */
    public void endPresidentialTurn() {
        if (this.state == GameState.POST_LEGISLATIVE) {
            throw new IllegalStateException();
        }

        if (electedPresident != null) { // If the PRESIDENTIAL_POWER_ELECTION was active, chooses the elected president.
            currentPresident = electedPresident;
            electedPresident = null;
        } else if (nextPresident != null) { // Once the PRESIDENTIAL_POWER_ELECTION round concludes, returns to the normal order.
            currentPresident = nextPresident;
            nextPresident = null;
        } else { // advance the presidency
            // Advance presidency:
            currentPresident = getNextActivePlayer(currentPresident);
        }
        currentChancellor = null;
        this.state = GameState.CHANCELLOR_NOMINATION;
    }

    /**
     * Finds the next active, living player in order.
     * @param player the player to find the next active player from.
     * @return the username of the next player in order. Returns null if no player was found.
     */
    private String getNextActivePlayer(String player) {
        for(int i = 1; i < playerList.size(); i++) {
            int index = (i + indexOfPlayer(player)) % playerList.size();
            if (playerList.get(index).isAlive()) {
                return playerList.get(index).getUsername();
            }
        }
        return null;
    }

    // </editor-fold>

    /////////////////// Legislative Session
    // <editor-fold desc="Legislative Session">

    /**
     * Starts the legislative session.
     * Sets the available policies and the game state.
     */
    private void startLegislativeSession() {
        state = GameState.LEGISLATIVE_PRESIDENT; // Legislative session begins.

        legislativePolicies = new ArrayList<>();
        for (int i = 0; i < PRESIDENT_DRAW_SIZE; i++) {
            legislativePolicies.add(draw.remove());
        }
    }

    /**
     * Gets the legislative choices available for the President.
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_PRESIDENT} or if an incorrect
     *                               number of policies is available.
     * @return a list of policies (size of {@code this.PRESIDENT_DRAW_SIZE}) representing the available choices.
     */
    public List<Policy> getPresidentLegislativeChoices() {
        if (state != GameState.LEGISLATIVE_PRESIDENT) {
            throw new IllegalStateException("Cannot get President legislative choices when not in legislative session.");
        } if (legislativePolicies.size() != PRESIDENT_DRAW_SIZE) {
            throw new IllegalStateException("An incorrect number of legislative policies are available for the president ("
                                            + legislativePolicies.size() + " instead of " + PRESIDENT_DRAW_SIZE);
        }
        return new ArrayList<>(legislativePolicies); // makes a copy of the legislative policies
    }

    /**
     * Discards the Policy in the list of presidential policy options.
     * @param index the index of the policy in the list of legislative choices to enact.
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_PRESIDENT}.
     * @throws IndexOutOfBoundsException if index is outside of range [0, 2] (inclusive).
     * @modifies this
     * @effects adds the card in the policy list at index {@code index} to the discard deck.
     *          Advances state to the {@code LEGISLATIVE_CHANCELLOR} state.
     */
    public void presidentDiscardPolicy(int index) {
        if (state != GameState.LEGISLATIVE_PRESIDENT) {
            throw new IllegalStateException("Cannot discard a policy from the president's hand in this state.");
        } else if (index < 0 || index >= PRESIDENT_DRAW_SIZE) {
            throw new IndexOutOfBoundsException("Cannot discard policy at the index " + index + ".");
        }
        discard.add(legislativePolicies.remove(index));
        state = GameState.LEGISLATIVE_CHANCELLOR;
    }

    /**
     * Gets the legislative choices available for the Chancellor.
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_CHANCELLOR}.
     * @return a list of policies (size of {@code this.CHANCELLOR_DRAW_SIZE}) representing the available choices.
     */
    public List<Policy> getChancellorLegislativeChoices() {
        if (getState() != GameState.LEGISLATIVE_CHANCELLOR) {
            throw new IllegalStateException("Cannot get Chancellor legislative choices when not in legislative session.");
        } if (legislativePolicies.size() != CHANCELLOR_DRAW_SIZE) {
            throw new IllegalStateException("An incorrect number of legislative policies are available for the chancellor ("
                    + legislativePolicies.size() + " instead of " + CHANCELLOR_DRAW_SIZE);
        }
        return new ArrayList<>(legislativePolicies);
    }

    /**
     * Enacts the Policy in the list of chancellor policy options.
     * @param index the index of the policy in the list of legislative choices to enact.
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_CHANCELLOR}.
     * @throws IndexOutOfBoundsException if index is outside of range [0, 2] (inclusive).
     * @modifies this
     * @effects enacts the policy at index {@code index} and discards the remaining card.
     *          Advances state to any relevant presidential powers, otherwise, advances to state {@code POST_LEGISLATIVE}.
     */
    public void chancellorEnactPolicy(int index) {
        if (getState() != GameState.LEGISLATIVE_CHANCELLOR) {
            throw new IllegalStateException("Cannot discard a policy from the chancellor's hand in this state.");
        } else if (index < 0 || index >= CHANCELLOR_DRAW_SIZE) {
            throw new IndexOutOfBoundsException("Cannot discard policy at the index " + index + ".");
        }

        board.enactPolicy(legislativePolicies.remove(index));
        discard.add(legislativePolicies.remove(0)); //Discard last remaining Policy
        onEnactPolicy();
    }

    /**
     * Marks the chancellor as having vetoed the current policy agenda.
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_CHANCELLOR}
     * @modifies this
     * @effects advances the state to {@code LEGISLATIVE_PRESIDENT_VETO} and awaits the president's approval.
     */
    public void chancellorVeto() {
        if (getState() != GameState.LEGISLATIVE_CHANCELLOR) {
            throw new IllegalStateException("Cannot veto in state " + getState().toString());
        }
        state = GameState.LEGISLATIVE_PRESIDENT_VETO;
    }

    /**
     * Handles the president's response to an initiated veto.
     * @param response is the president's vote (true = veto accepted, false = veto denied)
     * @throws IllegalStateException if called when the state is not {@code LEGISLATIVE_PRESIDENT_VETO}
     * @modifies this
     * @effects If the veto is denied ({@code response} = false), then the game returns to the chancellor's decision
     *          (state = LEGISLATIVE_CHANCELLOR).
     *          If the veto is approved ({@code response} = true), then the game advances the election tracker. If the
     *          tracker is at MAX_FAILED_ELECTIONS, enacts the first policy on top of the draw deck and carries out
     *          any consequences of the policy.
     */
    public void presidentialVeto(boolean response) {
        if (state != GameState.LEGISLATIVE_PRESIDENT_VETO) {
            throw new IllegalStateException("Cannot get president veto input during state " + getState().toString() + ".");
        }
        if (response) { // veto was approved, advance election tracker
            advanceElectionTracker();
        } else {        // veto was denied, return to chancellor selection
            state = GameState.LEGISLATIVE_CHANCELLOR;
        }
    }

    /**
     * Called AFTER a policy has been enacted, and sets the state according to any consequences.
     * @modifies this
     * @effects sets the state to handle any presidential powers that arise.
     *          Otherwise, state is set to {@code CHANCELLOR_SELECTION}.
     *          Also handles reshuffling the discard into the draw deck when there are insufficient cards for a hand.
     */
    private void onEnactPolicy() {
        if (draw.getSize() < MIN_DRAW_DECK_SIZE) {
            shuffleDiscardIntoDraw();
        }

        switch (board.getActivatedPower()) {
            case PEEK:
                state = GameState.PRESIDENTIAL_POWER_PEEK;
                break;
            case EXECUTION:
                state = GameState.PRESIDENTIAL_POWER_EXECUTION;
                break;
            case ELECTION:
                state = GameState.PRESIDENTIAL_POWER_ELECTION;
                break;
            case INVESTIGATE:
                state = GameState.PRESIDENTIAL_POWER_INVESTIGATE;
                break;
            case NONE:
                state = GameState.POST_LEGISLATIVE;
                break;
        }
    }

    //</editor-fold>

    /////////////////// Presidential Powers
    //<editor-fold desc="Presidential Powers">

    /**
     * Gets the preview of the top 3 cards of the deck during the {@code PRESIDENTIAL_POWER_PEEK} state.
     * @throws IllegalStateException if called when state is not {@code PRESIDENTIAL_POWER_PEEK}.
     * @return a size-3 array of Policies, where index 0 is the top of the stack. Advances the state of the game to
     *         POST_LEGISLATIVE.
     */
    public Policy[] getPeek() {
        if (state != GameState.PRESIDENTIAL_POWER_PEEK) {
            throw new IllegalStateException("Cannot peek when the power is not active.");
        } else if (draw.getSize() < 3) {
            throw new IllegalStateException("Insufficient cards in the draw deck.");
        }
        concludeTerm();
        return new Policy[] {draw.peek(0), draw.peek(1), draw.peek(2)};
    }

    /**
     * Investigates the party identity of a given player.
     * @param username the username of the player to investigate.
     * @throws IllegalStateException if called when state is not {@code PRESIDENTIAL_POWER_INVESTIGATE}.
     * @throws IllegalArgumentException if the player is not alive or in the game.
     * @return the party membership of the player. If the player is fascist or Hitler, returns Identity.FASCIST.
     *         if the player is liberal, returns Identity.LIBERAL.
     *         Once called, advances the state of the game to POST_LEGISLATIVE.
     */
    public Identity investigatePlayer(String username) {
        if (state != GameState.PRESIDENTIAL_POWER_INVESTIGATE) {
            throw new IllegalStateException("Cannot investigate a player when the power is not active.");
        } else if (!hasPlayer(username)) {
            throw new IllegalArgumentException("Player " + username + " does not exist.");
        } else if (!getPlayer(username).isAlive()) {
            throw new IllegalArgumentException("Cannot investigate killed player " + username + ".");
        }

        concludeTerm();

        if (getPlayer(username).isFascist()) {
            return Identity.FASCIST;
        } else {
            return Identity.LIBERAL;
        }
    }

    /**
     * Executes a given player.
     * @param username the username of the player to execute.
     * @throws IllegalStateException if called when state is not {@code PRESIDENTIAL_POWER_EXECUTION}.
     * @throws IllegalArgumentException if the player is already dead or is not in the game.
     * @modifies this
     * @effects The specified player is marked as not alive.
     *          If they were Hitler, advances the state of the game to LIBERAL_VICTORY_EXECUTION.
     *          Otherwise, once called, advances the state of the game to POST_LEGISLATIVE.
     */
    public void executePlayer(String username) {
        if (state != GameState.PRESIDENTIAL_POWER_EXECUTION) {
            throw new IllegalStateException("Cannot execute a player when the power is not active.");
        } else if (!hasPlayer(username)) {
            throw new IllegalArgumentException("Player " + username + " does not exist.");
        }

        Player playerToKill = getPlayer(username);
        if (!playerToKill.isAlive()) {
            throw new IllegalArgumentException("Cannot execute " + username + " because they are not alive.");
        }

        playerToKill.kill();
        if(playerToKill.isHitler()) { // game ends and liberals win.
            state = GameState.LIBERAL_VICTORY_EXECUTION;
        } else {
            concludeTerm();
        }
    }

    /**
     * Sets the next president through the Election power.
     * @param username the username of the player to become president next.
     * @throws IllegalStateException if called when state is not {@code PRESIDENTIAL_POWER_ELECTION}.
     * @throws IllegalArgumentException if the player is dead or is not in the game.
     * @modifies this
     * @effects The specified player becomes the next president.
     *          After the completion of their term, the presidency returns to the next president
     *          in the normal rotation order.
     *          Once called, advances the state to POST_LEGISLATIVE.
     */
    public void electNextPresident(String username) {
        if (state != GameState.PRESIDENTIAL_POWER_ELECTION) {
            throw new IllegalStateException("Cannot elect a player president when the power is not active.");
        } else if (!hasPlayer(username)) {
            throw new IllegalArgumentException("Player " + username + " does not exist.");
        } else if (!getPlayer(username).isAlive()) {
            throw new IllegalArgumentException("Cannot elect " + username + " because they are not alive.");
        }

        nextPresident = getNextActivePlayer(currentPresident);
        electedPresident = username;
        concludeTerm();
    }

    //</editor-fold>

}
