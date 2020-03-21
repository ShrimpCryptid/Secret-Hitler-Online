package server.util;

import game.GameState;
import game.SecretHitlerGame;
import io.javalin.websocket.WsContext;
import org.json.JSONObject;

import java.util.*;

/**
 * A Lobby holds a collection of websocket connections, each representing a player.
 * It maintains the game that the connections are associated with.
 */
public class Lobby {

    private SecretHitlerGame game;
    private Map<WsContext, String> userToUsername;
    private Set<String> usernames;
    private Set<String> usersInGame;

    /**
     * Constructs a new Lobby.
     */
    public Lobby() {
        userToUsername = new HashMap<>();
        usernames = new HashSet<>();
    }

    /////// User Management
    //<editor-fold desc="User Management">

    /**
     * Returns whether the given user (websocket connection) is in this lobby
     * @param context the Websocket context of a user.
     * @return true iff the {@code context} is in this lobby.
     */
    public boolean hasUser(WsContext context) {
        return userToUsername.containsKey(context);
    }

    /**
     * Returns true if the lobby has a user with a given username.
     * @param name the username to check the Lobby for.
     * @return true iff the username {@code name} is in this lobby.
     */
    public boolean hasUsername(String name) {
        return usernames.contains(name);
    }

    /**
     * Adds a user (websocket connection) to the lobby.
     * @param context the websocket connection context.
     * @param name the name of the player to be added.
     * @throws IllegalArgumentException if a duplicate websocket is added, or if there is already a websocket with the
     *         given name in the game.
     * @modifies this
     * @effects adds the given user to the lobby. If the game has already started, the player is added as a spectator
     *          and cannot play in the game.
     *          If the username {@code name} is already in the game but there is no websocket associated with it
     *          (ie, if the user has been removed), the new {@code context} is associated with it.
     */
    public void addUser(WsContext context, String name) {
        if(userToUsername.containsKey(context)) {
            throw new IllegalArgumentException("Duplicate websockets cannot be added to a lobby.");
        } else {
            if (usernames.contains(name)) { // This username exists in this context but no websocket is associated.
                // We allow this user to become the new websocket associated with the username.
                userToUsername.put(context, name);

            } else { // This is a new user with a new name, so we add them to the Lobby.
                userToUsername.put(context, name);
                usernames.add(name);
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
    public void removeUser(WsContext context) {
        if (!hasUser(context)) {
            throw new IllegalArgumentException("Cannot remove a websocket that is not in the Lobby.");
        } else {
            userToUsername.remove(context);
        }
    }

    //</editor-fold>

    /**
     * Returns whether the Lobby is currently in a game.
     * @return true iff the Lobby has a currently active game.
     */
    public boolean isInGame() {
        return game != null && game.getState() != GameState.SETUP;
    }

    /**
     * Returns the current game.
     * @throws RuntimeException if called when there is no active game ({@code !this.isInGame()}).
     * @return the SecretHitlerGame for this lobby.
     */
    public SecretHitlerGame game() {
        if (game == null) {
            throw new RuntimeException();
        } else {
            return game;
        }
    }

    /**
     * Sends a message to every connected user with the updated game state.
     * @effects a message containing a JSON object representing the state of the SecretHitlerGame is sent
     *          to each WsContext in the username map.
     */
    public void updateAllUsers() {
        JSONObject updatedGame = GameToJSONConverter.convert(game);
        for (WsContext ws : userToUsername.keySet()) {
            ws.send(updatedGame);
        }
    }

}
