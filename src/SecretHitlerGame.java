import datastructures.Deck;
import datastructures.Player;
import datastructures.Policy;
import datastructures.board.Board;

import java.util.ArrayList;
import java.util.List;

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

    // Keeps track of the number of fascists that should be in the game for a given number
    // of players.                                         -   -   -   -   -   5   6   7   8   9  10
    public static final int[] NUM_FASCISTS_FOR_PLAYERS = {-1, -1, -1, -1, -1,  1,  1,  2,  2,  3,  3};

    // The number of fascist and liberal policies in a standard deck.
    public static final int NUM_FASCIST_POLICIES = 11;
    public static final int NUM_LIBERAL_POLICIES = 6;

    public static final int MIN_PLAYERS = 5;
    public static final int MAX_PLAYERS = 10;

    // Private fields

    private List<Player> playerList;
    private Board board;
    private Deck discard;
    private Deck draw;

    private GameState state;

    /**
     * Constructs a new game of Secret Hitler.
     * @modifies this
     * @effects this is a new SecretHitlerGame in setup mode with no players.
     */
    public SecretHitlerGame() {
        playerList = new ArrayList<>();
        state = GameState.SETUP;
    }

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
     * Attempts to add a player to the list of active players.
     * @param username the username of the player to add.
     * @modifies this
     * @effects if 1) the number of players is less than {@code MAX_PLAYERS}, 2) the game is in setup mode, and 3)
     *          there is not already a player with the given username,
     *          adds a new Player with the given username to the list of active players.
     * @return true if the player was successfully added, false otherwise.
     */
    public boolean tryAddPlayer(String username) {
        if (playerList.size() >= MAX_PLAYERS || hasPlayer(username)) {
            return false;
        }
        playerList.add(new Player(username));
        return true;
    }

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


        return true;
    }

    /**
     * Resets the Draw and Discard decks.
     * @effects
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
     * Randomly assigns the players roles.
     * @modifies this
     * @effects all Players in playerList are assigned either LIBERAL, FASCIST, or HITLER.
     *          The number of each is given by the following table:
     *          # players:  5   6   7   8   9   10
     *          # liberals: 3   4   4   5   5   6
     *          # fascists: 1   1   2   2   3   3
     *          # hitler:   1   1   1   1   1   1
     */
    private void assignRoles() {

    }

    /**
     * Gets the current state of the SecretHitlerGame.
     * @return
     */
    public GameState getState() {

    }

}
