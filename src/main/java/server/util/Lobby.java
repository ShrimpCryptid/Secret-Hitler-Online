package server.util;

import game.GameState;
import game.SecretHitlerGame;
import io.javalin.websocket.WsContext;
import org.json.JSONObject;
import server.SecretHitlerServer;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentSkipListSet;

/**
 * A Lobby holds a collection of websocket connections, each representing a player.
 * It maintains the game that the connections are associated with.
 *
 * A user is defined as an active websocket connection.
 */
public class Lobby {

    private SecretHitlerGame game;
    final private Map<WsContext, String> userToUsername;
    final private Queue<String> activeUsernames;
    final private Set<String> usersInGame;

    public static long TIMEOUT_DURATION_IN_MIN = 30;
    private long timeout;

    /**
     * Constructs a new Lobby.
     */
    public Lobby() {
        userToUsername = new ConcurrentHashMap<>();
        activeUsernames = new ConcurrentLinkedQueue<>();
        usersInGame = new ConcurrentSkipListSet<>();
        resetTimeout();
    }

    /**
     * Resets the internal timeout for this.
     * @effects The lobby will time out in {@code TIMEOUT_DURATION_MS} ms from now.
     */
    synchronized public void resetTimeout() {
        // The timeout duration for the server. (currently 30 minutes)
            long MS_PER_MINUTE = 1000 * 60;
            timeout = System.currentTimeMillis() + MS_PER_MINUTE * TIMEOUT_DURATION_IN_MIN;
    }

    /**
     * Returns whether the lobby has timed out.
     * @return true if the Lobby has timed out.
     */
    synchronized public boolean hasTimedOut() {
        return timeout <= System.currentTimeMillis();
    }

    /**
     * Returns the set of websocket connections connected to this Lobby.
     * @return a set of WsContexts, where each context is a user connected to the Lobby.
     */
    synchronized public Set<WsContext> getConnections() {
        return userToUsername.keySet();
    }

    /////// User Management
    //<editor-fold desc="User Management">

    /**
     * Returns whether the given user (websocket connection) is in this lobby
     * @param context the Websocket context of a user.
     * @return true iff the {@code context} is in this lobby.
     */
    synchronized public boolean hasUser(WsContext context) {
        return userToUsername.containsKey(context);
    }

    /**
     * Returns whether a user with the given name exists in this lobby.
     * @param context the Websocket context of the user.
     * @param name the name of the user.
     * @return true iff {@code context} is a user in the lobby with the name {@code name}.
     */
    synchronized public boolean hasUser(WsContext context, String name) {return userToUsername.containsKey(context) && userToUsername.get(context).equals(name); }

    /**
     * Returns true if the lobby has a user with a given username.
     * @param name the username to check the Lobby for.
     * @return true iff the username {@code name} is in this lobby.
     */
    synchronized public boolean hasUserWithName(String name) {
        return activeUsernames.contains(name);
    }

    /**
     * Checks if a user can be added back to the lobby while a game is running.
     * @param name the name of the user to add.
     * @return true if the user can be added. A user can only be added back if they were in the current game but were then
     *         removed from the lobby.
     *
     */
    synchronized public boolean canAddUserDuringGame(String name) {
        return (usersInGame.contains(name) && !activeUsernames.contains(name)); // the user was in the game but was disconnected.
    }

    /**
     * Checks whether the lobby is full.
     * @return Returns true if the number of players in the lobby is {@literal >= } {@code SecretHitlerGame.MAX_PLAYERS}.
     */
    synchronized public boolean isFull() {
        return activeUsernames.size() >= SecretHitlerGame.MAX_PLAYERS;
    }

    /**
     * Adds a user (websocket connection) to the lobby.
     * @param context the websocket connection context.
     * @param name the name of the player to be added.
     * @throws IllegalArgumentException if a duplicate websocket is added, if there is already a websocket with the
     *         given name in the game, if the lobby is full, if the player has a duplicate name,
     *         or if a new player is added during a game.
     * @modifies this
     * @effects adds the given user to the lobby.
     *          If the game has already started, the player can only join if a player with the name {@name} was
     *          previously in the same game but was removed.
     */
    synchronized public void addUser(WsContext context, String name) {
        if(userToUsername.containsKey(context)) {
            throw new IllegalArgumentException("Duplicate websockets cannot be added to a lobby.");
        } else {
            if (isInGame()) {
                if(canAddUserDuringGame(name)) { // This username is in the game but is not currently connected.
                    // allow the user to be connected.
                    userToUsername.put(context, name);
                } else {
                    throw new IllegalArgumentException("Cannot add a new player to a lobby currently in a game.");
                }
            } else {
                if (!isFull()) {
                    if (!hasUserWithName(name)) { // This is a new user with a new name, so we add them to the Lobby.
                        userToUsername.put(context, name);
                        activeUsernames.add(name);
                    } else {
                        throw new IllegalArgumentException("Cannot add duplicate names.");
                    }
                } else {
                    throw new IllegalArgumentException("Cannot add the player because the lobby is full.");
                }
            }
        }
    }

    /**
     * Removes a user from the Lobby.
     * @param context the websocket connection context of the player to remove.
     * @throws IllegalArgumentException if {@code context} is not a user in the Lobby.
     * @modifies this
     * @effects removes the user context (websocket connection) of the player from the lobby.
     */
    synchronized public void removeUser(WsContext context) {
        if (!hasUser(context)) {
            throw new IllegalArgumentException("Cannot remove a websocket that is not in the Lobby.");
        } else {
            activeUsernames.remove(userToUsername.get(context));
            userToUsername.remove(context);
        }
    }

    /**
     * Returns the number of active users connected to the Lobby.
     * @return the number of active websocket connections currently in the lobby.
     */
    synchronized public int getUserCount() {
        return userToUsername.size();
    }

    /**
     * Sends a message to every connected user with the current game state.
     * @effects a message containing a JSONObject representing the state of the SecretHitlerGame is sent
     *          to each connected WsContext. ({@code GameToJSONConverter.convert()})
     */
    synchronized public void updateAllUsers() {
        for (WsContext ws : userToUsername.keySet()) {
            updateUser(ws);
        }
        //Check if the game ended.
        if (game != null && (game.getState() == GameState.FASCIST_VICTORY_ELECTION
                || game.getState() == GameState.FASCIST_VICTORY_POLICY
                || game.getState() == GameState.LIBERAL_VICTORY_EXECUTION
                || game.getState() == GameState.LIBERAL_VICTORY_POLICY)) {
            game = null;
        }
    }

    /**
     * Sends a message to the specified user with the current game state.
     * @param ctx the WsContext websocket context.
     * @effects a message containing a JSONObject representing the state of the SecretHitlerGame is sent
     *          to the specified WsContext. ({@code GameToJSONConverter.convert()})
     */
    synchronized public void updateUser(WsContext ctx) {
        JSONObject message;

        if (isInGame()) {
            message = GameToJSONConverter.convert(game); // sends the game state
            message.put(SecretHitlerServer.PARAM_PACKET_TYPE, SecretHitlerServer.PACKET_GAME_STATE);
        } else {
            message = new JSONObject();
            message.put(SecretHitlerServer.PARAM_PACKET_TYPE, SecretHitlerServer.PACKET_LOBBY);
            message.put("user-count", getUserCount());
            message.put("usernames", activeUsernames.toArray());
        }
        ctx.send(message.toString());
    }

    //</editor-fold>

    ////// Game Management
    //<editor-fold desc="Game Management">

    /**
     * Returns whether the Lobby is currently in a game.
     * @return true iff the Lobby has a currently active game.
     */
    synchronized public boolean isInGame() {
        return game != null;
    }

    /**
     * Starts a new SecretHitlerGame with the connected users as players.
     * @throws RuntimeException if there are an insufficient number of players to start a game, if there are too
     *         many in the lobby, or if the lobby is in a game ({@code isInGame() == true}).
     * @modifies this
     * @effects creates and stores a new SecretHitlerGame.
     *          The usernames of all active users are added to the game in a randomized order.
     */
    synchronized public void startNewGame() {
        if (userToUsername.size() < SecretHitlerGame.MIN_PLAYERS) {
            throw new RuntimeException("Too many users to start a game.");
        } else if (userToUsername.size() > SecretHitlerGame.MAX_PLAYERS) {
            throw new RuntimeException("Too many users to start a game.");
        } else if (isInGame()) {
            throw new RuntimeException("Cannot start a new game while a game is in progress.");
        }
        usersInGame.clear();
        usersInGame.addAll(userToUsername.values());
        List<String> playerNames = new ArrayList<>(userToUsername.values());
        Collections.shuffle(playerNames);
        game = new SecretHitlerGame(playerNames);
    }

    /**
     * Returns the current game.
     * @throws RuntimeException if called when there is no active game ({@code !this.isInGame()}).
     * @return the SecretHitlerGame for this lobby.
     */
    synchronized public SecretHitlerGame game() {
        if (game == null) {
            throw new RuntimeException();
        } else {
            return game;
        }
    }

    //</editor-fold>

}
