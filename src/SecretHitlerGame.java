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

    /////////////// Static Fields

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

    ////////////// Private Fields

    private List<Player> playerList;
    private Board board;
    private Deck discard;
    private Deck draw;

    private int electionTracker;

    private GameState state;

    private Random random;

    private String lastPresident;
    private String lastChancellor;
    // The last president and chancellor that were successfully voted into office.
    private String currentPresident;
    private String currentChancellor;

    private Map<String, Boolean> voteMap;

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


    ////////////////// Player Management


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
     * @return
     */
    public boolean removePlayer(String username) {
        //TODO: Implement removing players
        throw new RuntimeException();
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

    /////////////////////// Starting a Game

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


    //////////////// Deck Management

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


    ////////////// State Management


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


    ////////////// Input Handling

    /**
     * Selects the chancellor for the current legislation.
     * @param username username of the chancellor to elect.
     * @throws IllegalStateException if the state is not {@code CHANCELLOR_SELECTION}.
     * @throws IllegalArgumentException if the player named {@code username} was one of the last elected officials.
     * @modifies this
     * @effects the current chancellor is set to the player named {@code username}. The game state is set to be in
     *          CHANCELLOR_VOTING.
     */
    public void nominateChancellor(String username) {
        if(username.equals(lastChancellor) || username.equals(lastPresident)) {
            throw new IllegalArgumentException("Cannot elect chancellor that was previously in office.");
        }
        if (getState() != GameState.CHANCELLOR_NOMINATION) {
            throw new IllegalStateException("Cannot elect a chancellor now (invalid state).");
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
     *          If the vote passed, the state advances to {@code LEGISLATIVE_PRESIDENT}.
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

        if(voteMap.keySet().size() == playerList.size()) { // All players have voted
            // tally votes
            float yesVotes = 0.0f;
            for (Boolean voteEntry : voteMap.values()) {
                if(voteEntry) {
                    yesVotes += 1;
                }
            }

            if (yesVotes / ((float) playerList.size()) > VOTING_CUTOFF) {
                // vote passed
                if (getPlayer(username).isHitler() && board.fascistsCanWinByElection()) {
                    state = GameState.FASCIST_VICTORY_ELECTION; // Fascists won by electing Hitler: game ends.
                } else {
                    state = GameState.LEGISLATIVE_PRESIDENT; // Legislative session begins with president
                }
            } else {
                // vote failed
                onFailedVote();
            }
        }
    }

    /**
     * Returns a copy of the map representing what each player voted.
     * @return a map, where the keys are the usernames and the booleans are the vote (yes/no) of the player.
     */
    public Map<String, Boolean> getVotes() {
        return new HashMap<>(voteMap);
    }

    /**
     * Advances the election tracker and enacts a policy if needed.
     * @modifies this
     * @effects If the tracker < 2, advances the tracker by 1.
     *          If the tracker == 2, rests the tracker to 0 and enacts the first policy on the top of the draw pile.
     */
    private void onFailedVote() {
        electionTracker += 1;
        if (electionTracker == MAX_FAILED_ELECTIONS) {
            Policy newPolicy = draw.remove();
            board.enactPolicy(newPolicy);
            // Note that the newPolicy is NOT added back to the discard pile.
            electionTracker = 0; // Reset

            onEnactPolicy();
        }
    }


    //////////// Legislative Actions

    /**
     * Called AFTER a policy has been enacted, and sets the state according to any consequences.
     * @modifies this
     * @effects sets the state to handle any presidential powers that arise.
     *          Otherwise, state is set to {@code CHANCELLOR_SELECTION}.
     */
    private void onEnactPolicy() {
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
                state = GameState.CHANCELLOR_NOMINATION; // Loop back to next decision.
                break;
        }
    }

}
