package server.util;

import game.CpuPlayer;
import game.GameState;
import game.SecretHitlerGame;
import io.javalin.websocket.WsContext;
import org.json.JSONObject;
import server.SecretHitlerServer;

import java.io.IOException;
import java.io.Serializable;
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
public class Lobby implements Serializable {

    private SecretHitlerGame game;

    // These two marked transient because they track currently active/connected users.
    transient private ConcurrentHashMap<WsContext, String> userToUsername;
    transient private Queue<String> activeUsernames;

    final private Set<String> usersInGame;
    final private ConcurrentHashMap<String, String> usernameToIcon;

    // The number of players that should be in this lobby. If there are fewer
    // users, backfills with CpuPlayers.
    private int lobbySize;
    private Set<CpuPlayer> cpuPlayers;

    /* Used to reassign users to previously chosen images if they disconnect*/
    final private ConcurrentHashMap<String, String> usernameToPreferredIcon;

    public static long LOBBY_TIMEOUT_DURATION_IN_MIN = 10;
    public static float PLAYER_TIMEOUT_IN_SEC = 3;
    public static float CPU_ACTION_DELAY = 4;
    private long timeout;
    private static int MAX_TIMER_SCHEDULING_ATTEMPTS = 2;
    transient private Timer timer = new Timer();

    static String DEFAULT_ICON = "p_default";

    /**
     * Constructs a new Lobby.
     */
    public Lobby() {
        userToUsername = new ConcurrentHashMap<WsContext, String>();
        activeUsernames = new ConcurrentLinkedQueue<>();
        usersInGame = new ConcurrentSkipListSet<>();
        usernameToIcon = new ConcurrentHashMap<>();
        usernameToPreferredIcon = new ConcurrentHashMap<>();
        lobbySize = SecretHitlerGame.MIN_PLAYERS;
        cpuPlayers = new ConcurrentSkipListSet<>();
        resetTimeout();
    }

    /**
     * Resets the internal timeout for this.
     * @effects The lobby will time out in {@code TIMEOUT_DURATION_MS} ms from now.
     */
    synchronized public void resetTimeout() {
        // The timeout duration for the server. (currently 30 minutes)
            long MS_PER_MINUTE = 1000 * 60;
            timeout = System.currentTimeMillis() + MS_PER_MINUTE * LOBBY_TIMEOUT_DURATION_IN_MIN;
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
     * Attempts to update the lobby size. 
     * 
     * @param newLobbySize The new size of the lobby.
     * 
     * @effects Sets the number of players in the lobby. The lobby size must be
     * a valid number of players (5-10) and can't be less than the number of
     * users currently connected.
     */
    synchronized public void trySetLobbySize(int newLobbySize) {
      // Apply bounds to newLobbySize
      newLobbySize = Math.max(SecretHitlerGame.MIN_PLAYERS, newLobbySize);
      newLobbySize = Math.min(SecretHitlerGame.MAX_PLAYERS, newLobbySize);
      newLobbySize = Math.max(SecretHitlerGame.MAX_PLAYERS, activeUsernames.size());

      lobbySize = newLobbySize;
    } 

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
        return userToUsername.values().contains(name);
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

                    usernameToIcon.put(name, DEFAULT_ICON); // load default icon
                    // Try setting the player's icon using their previous choice
                    if (usernameToPreferredIcon.containsKey(name)) {
                        String iconID = usernameToPreferredIcon.get(name);
                        trySetUserIcon(iconID, context);
                    }
                } else {
                    throw new IllegalArgumentException("Cannot add a new player to a lobby currently in a game.");
                }
            } else {
                if (!isFull()) {
                    if (!hasUserWithName(name)) { // This is a new user with a new name, so we add them to the Lobby.
                        userToUsername.put(context, name);
                        if (!activeUsernames.contains(name)) {
                            activeUsernames.add(name);
                        }
                        // Set icon to default
                        usernameToIcon.put(name, DEFAULT_ICON);
                        // Attempt to retrieve previous icon (if it exists)
                        if (usernameToPreferredIcon.containsKey(name)) {
                            String iconID = usernameToPreferredIcon.get(name);
                            trySetUserIcon(iconID, context);
                        }

                        // Update the lobby size if needed
                        lobbySize = Math.max(activeUsernames.size(), lobbySize);
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
            // Delay removing players from the list by adding it to a timer.
            int delay_in_ms = (int) (PLAYER_TIMEOUT_IN_SEC * 1000);
            final String username = userToUsername.get(context);

            int timerSchedulingAttempts = 0;
            while (timerSchedulingAttempts < MAX_TIMER_SCHEDULING_ATTEMPTS) {
                try {
                    timer.schedule(new RemoveUserTask(username), delay_in_ms);
                    break; // exit loop if successful
                } catch (IllegalStateException e) {
                    // Timer hit an error state and must be reset.
                    timer.cancel();
                    timer = new Timer();
                    timerSchedulingAttempts++;
                }
            }
            if (timerSchedulingAttempts == MAX_TIMER_SCHEDULING_ATTEMPTS) {
                System.out.println("Failed to schedule removal of the user '" + username + "'.");
            }

            userToUsername.remove(context);
        }
    }

    /**
     * Small helper class for removing users from the active users queue.
     */
    class RemoveUserTask extends TimerTask {
        private final String username;

        RemoveUserTask(String username) { this.username = username; }

        public void run() {
            // If the user is still disconnected when the task runs, mark them as inactive and
            // remove them from the lobby.
            if (!userToUsername.values().contains(username) && activeUsernames.contains(username)) {
                activeUsernames.remove(username);

                if (usernameToIcon.containsKey(username)) {
                    usernameToIcon.remove(username);  // possible for users to disconnect before choosing icon
                }
                updateAllUsers();
            }
        }
    }

    /**
     * Returns the number of active users connected to the Lobby.
     * @return the number of active websocket connections currently in the lobby.
     */
    synchronized public int getUserCount() {
        return activeUsernames.size();
    }

    /**
     * Sends a message to every connected user with the current game state.
     * @effects a message containing a JSONObject representing the state of the SecretHitlerGame is sent
     *          to each connected WsContext. ({@code GameToJSONConverter.convert()}). Also
     *          updates all connected CpuPlayers.
     */
    synchronized public void updateAllUsers() {
        for (WsContext ws : userToUsername.keySet()) {
            updateUser(ws);
        }

        //Check if the game ended.
        if (game != null && game.hasGameFinished()) {
            game = null;
            cpuPlayers.clear();
        }

        // Update all the CpuPlayers so they can act
        boolean didCpuUpdateState = false;
        if (isInGame()) {
            // Update all CPUs before allowing them to start acting
            for (CpuPlayer cpu : cpuPlayers) {
              cpu.update(game);
            }
            // Allow CPUs to act. If 
            for (CpuPlayer cpu : cpuPlayers) {
                if (game.getState() == GameState.CHANCELLOR_VOTING) {
                  // We're in a voting step, so it doesn't matter if the CPU is
                  // acting unless the gamestate changes.
                  boolean stateUpdated = cpu.act(game);
                  // Did acting cause voting to end?
                  if (stateUpdated && game.getState() != GameState.CHANCELLOR_VOTING) {
                    didCpuUpdateState = true;
                    break;
                  }
                } else {
                  if (cpu.act(game)) {
                    didCpuUpdateState = true;
                    break;
                  }
                }
            }
        }
        // If the game changed because of a CPU action, send an update after a
        // delay.
        // TODO: This is unsafe, and can still cause multiple actions to happen simultaneously. Add a max tick rate.
        if (didCpuUpdateState) {
            int delay_in_ms = (int) (CPU_ACTION_DELAY * 1000);
            timer.schedule(new UpdateUsersTask(), delay_in_ms);
        }
    }


    /**
     * Small helper class for removing users from the active users queue.
     */
    class UpdateUsersTask extends TimerTask {
      public void run() {
          updateAllUsers();
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
            message.put("lobby-size", lobbySize);
        }
        // Add user icons to the update message
        JSONObject icons = new JSONObject(usernameToIcon);
        message.put("icon", icons);

        ctx.send(message.toString());
    }

    /**
     * Called when an object is deserialized (see Serializable in Java docs).
     * Initializes the userToUsername and activeUsernames, as they are transient objects and not saved during
     * serialization of Lobby.
     * @param in the Object Input Stream that is reading in the object.
     * @throws IOException
     * @throws ClassNotFoundException
     */
    private void readObject(java.io.ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();
        userToUsername = new ConcurrentHashMap<>();
        activeUsernames = new ConcurrentLinkedQueue<>();
        timer = new Timer();
    }

    /**
     * Attempts to set the player's icon to the given iconID and returns whether it was set.
     * @param iconID the ID of the new icon to give the player.
     * @param user the user to change the icon of.
     * @effects If no other user has the given {@code iconID}, sets the icon of the {@code user}
     *          to {@code iconID}. (exception is for the default value.)
     * @throws IllegalArgumentException if {@code user} is not in the game.
     */
    synchronized public void trySetUserIcon(String iconID, WsContext user) {
        // Verify that the user exists.
        if (!hasUser(user)) {
            throw new IllegalArgumentException("User is not in this lobby.");
        }

        String username = userToUsername.get(user);
        // Verify that no user has the same icon
        if (!iconID.equals(DEFAULT_ICON)) {  // all icons other than the default cannot be shared.
            for (String name : userToUsername.values()) {
                if (usernameToIcon.containsKey(name) && usernameToIcon.get(name).equals(iconID)) {
                    return;
                }
            }
        }

        usernameToIcon.put(username, iconID);
        usernameToPreferredIcon.put(username, iconID);
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
     *         many in the lobby, or if the lobby is in a game ({@code isInGame() == true}). Also throws exception if
     *         not all players have selected an icon.
     * @modifies this
     * @effects creates and stores a new SecretHitlerGame.
     *          The usernames of all active users are added to the game in a randomized order.
     */
    synchronized public void startNewGame() {
        if (activeUsernames.size() > SecretHitlerGame.MAX_PLAYERS) {
            throw new RuntimeException("Too many users to start a game.");
        } else if (isInGame()) {
            throw new RuntimeException("Cannot start a new game while a game is in progress.");
        }

        // Check that all players have (non-default) icons set.
        for (String username : activeUsernames) {
            if (usernameToIcon.get(username).equals(DEFAULT_ICON)) {
                throw new RuntimeException("Not all players have selected icons.");
            }
        }

        usersInGame.clear();
        usersInGame.addAll(userToUsername.values());

        // Generate CpuPlayers if the lobby size has not been met
        List<String> cpuNames = new ArrayList<>();
        cpuPlayers.clear();
        if(usersInGame.size() < lobbySize) {
          int numCpuPlayersToGenerate = lobbySize - usersInGame.size();
          int i = 1;
          while (numCpuPlayersToGenerate > 0) {
            String botName = "Bot " + i;
            if (!userToUsername.containsValue(botName)) {
              cpuNames.add(botName);
              cpuPlayers.add(new CpuPlayer(botName));
              numCpuPlayersToGenerate--;
            }
            i++;

            // TODO: Assign a random user icon to the CpuPlayer.
          }
        }

        // Initialize the new game
        List<String> playerNames = new ArrayList<>(activeUsernames);
        playerNames.addAll(cpuNames);
        Collections.shuffle(playerNames);

        game = new SecretHitlerGame(playerNames);

        // Initialize all of the CpuPlayers
        for (CpuPlayer cpu : cpuPlayers) {
          cpu.initialize(game);
        }
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
