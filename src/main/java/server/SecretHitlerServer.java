package server;

import game.datastructures.Identity;
import game.datastructures.Policy;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.websocket.WsCloseContext;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsMessageContext;
import org.json.JSONObject;
import server.util.Lobby;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class SecretHitlerServer {


    ////// Static Fields
    // <editor-fold desc="Static Fields">

    public static final int PORT_NUMBER = 4000;

    // Passed to server
    public static final String PARAM_LOBBY = "lobby";
    public static final String PARAM_NAME = "name";
    public static final String PARAM_COMMAND = "command";
    public static final String PARAM_TARGET = "target-user";
    public static final String PARAM_VOTE = "vote";
    public static final String PARAM_VETO = "veto";
    public static final String PARAM_CHOICE = "choice"; // the index of the chosen policy.

    // Passed to client

    // The type of the packet tells the client how to parse the contents.
    public static final String PARAM_PACKET_TYPE = "type";
    public static final String PACKET_INVESTIGATION = "investigation";
    public static final String PACKET_GAME_STATE = "game";
    public static final String PACKET_LOBBY = "lobby";
    public static final String PACKET_OK = "ok"; // general response packet sent after any successful command.

    public static final String PARAM_INVESTIGATION = "investigation";
    public static final String FASCIST = "FASCIST";
    public static final String LIBERAL = "LIBERAL";

    // These are the commands that can be passed via a websocket connection.
    public static final String COMMAND_PING = "ping";
    public static final String COMMAND_START_GAME = "start-game";
    public static final String COMMAND_GET_STATE = "get-state";

    public static final String COMMAND_NOMINATE_CHANCELLOR = "nominate-chancellor";
    public static final String COMMAND_REGISTER_VOTE = "register-vote";
    public static final String COMMAND_REGISTER_PRESIDENT_CHOICE = "register-president-choice";
    public static final String COMMAND_REGISTER_CHANCELLOR_CHOICE = "register-chancellor-choice";
    public static final String COMMAND_REGISTER_CHANCELLOR_VETO = "chancellor-veto";
    public static final String COMMAND_REGISTER_PRESIDENT_VETO = "president-veto";

    public static final String COMMAND_REGISTER_EXECUTION = "register-execution";
    public static final String COMMAND_REGISTER_SPECIAL_ELECTION = "register-special-election";
    public static final String COMMAND_GET_INVESTIGATION = "get-investigation";
    public static final String COMMAND_REGISTER_PEEK = "register-peek";

    public static final String COMMAND_END_TERM = "end-term";


    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;

    //</editor-fold>

    ///// Private Fields
    // <editor-fold desc="Private Fields">

    final private static Map<WsContext, Lobby> userToLobby = new ConcurrentHashMap<>();
    final private static Map<String, Lobby> codeToLobby = new ConcurrentHashMap<>();


    // </editor-fold>

    ////// Private Classes



    public static void main(String[] args) {

        Javalin serverApp = Javalin.create(config -> {
            config.enableCorsForOrigin("http://localhost:3000/");
            //config.enableCorsForOrigin("http://192.168.29.242");
        }).start(PORT_NUMBER);

        serverApp.get("/check-login", SecretHitlerServer::checkLogin); // Checks if a login is valid.
        serverApp.get("/new-lobby", SecretHitlerServer::createNewLobby); // Creates and returns the code for a new lobby

        serverApp.ws("/game", wsHandler -> {
            wsHandler.onConnect(SecretHitlerServer::onWebsocketConnect);
            wsHandler.onMessage(SecretHitlerServer::onWebSocketMessage);
            wsHandler.onClose(SecretHitlerServer::onWebSocketClose);
        });


    }

    /**
     * Checks for and removes any lobbies that have timed out.
     * @effects For each lobby in the {@code codeToLobby} map, checks if the lobby has timed out.
     *          If so, closes all websockets associated with the lobby and removes them from the
     *          {@code userToLobby} map, then removes the lobby from the {@code codeToLobby} map.
     */
    private static void removeInactiveLobbies() {
        Set<String> removedLobbyCodes = new HashSet<>();
        int removedCount = 0;
        Iterator<Map.Entry<String, Lobby>> itr = codeToLobby.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, Lobby> entry = itr.next();
            Lobby lobby = entry.getValue();
            if (lobby.hasTimedOut()) {
                // Remove the websocket connections.
                for (WsContext ctx : lobby.getConnections()) {
                    ctx.session.close(504, "The lobby has timed out.");
                    userToLobby.remove(ctx);
                }
                removedLobbyCodes.add(entry.getKey());
                removedCount++;
                itr.remove();
            }
        }
        if (removedCount > 0) {
            System.out.println(String.format("Removed %d lobbies: %s", removedCount, removedLobbyCodes));
        }
    }


    /////// Get Requests
    //<editor-fold desc="Get Requests">

    /**
     * Determines whether a login is valid.
     * @param ctx the context of the login request.
     * @requires the context must have the following parameters:
     *          {@code lobby}: the code of the lobby.
     *          {@code name}: the username of the user.
     *          {@code command}: the command
     * @effects Result status is one of the following:
     *          <p>- 400: if the {@code lobby} or {@code name} parameters are missing.
     *          <p>- 404: if there is no lobby with the given code
     *          <p>- 403: the username is invalid (there is already another user with that name in the lobby.)
     *          <p>- 488: the lobby is currently in a game.
     *          <p>- 489: the lobby is full.
     *          <p>- 200: Success. There is a lobby with the given name and the user can open a websocket connection with
     *              these login credentials.
     */
    public static void checkLogin(Context ctx) {
        String lobbyCode = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);
        if (lobbyCode == null || name == null) {
            ctx.status(400);
            ctx.result("Lobby and name must be specified.");
        }

        if (!codeToLobby.containsKey(lobbyCode)) { // lobby does not exist
            ctx.status(404);
            ctx.result("No such lobby found.");
        } else { // the lobby exists
            Lobby lobby = codeToLobby.get(lobbyCode);

            if(lobby.isFull()) {
                ctx.status(489);
                ctx.result("The lobby is currently full.");
            } else if (lobby.isInGame()) {
                if (lobby.canAddUserDuringGame(name)) {
                    ctx.status(200);
                    ctx.result("Login request valid (re-joining an existing game).");
                } else {
                    ctx.status(488);
                    ctx.result("The lobby is currently in a game.");
                }
            } else if (lobby.hasUserWithName(name)) { // repeat username.
                ctx.status(403);
                ctx.result("There is already a user with the name '" + name + "' in the lobby.");
            } else { // unique username found. Return OK.
                ctx.status(200);
                ctx.result("Login request valid.");
            }
        }
    }

    /**
     * Generates a new lobby and returns the access code.
     * @param ctx the HTTP get request context.
     */
    public static void createNewLobby(Context ctx) {
        removeInactiveLobbies();

        String newCode = generateCode();
        while(codeToLobby.containsKey(newCode)) {
            newCode = generateCode();
        }

        Lobby lobby = new Lobby();
        codeToLobby.put(newCode, lobby); // add a new lobby with the given code.

        ctx.status(200);
        ctx.result(newCode);
        System.out.println("New lobby created: " + newCode);
        System.out.println("Available lobbies: " + codeToLobby.keySet());
    }

    /**
     * Generates a random code.
     * @return a String code, with length specified by {@code this.CODE_LENGTH} and characters randomly
     *         chosen from {@code CODE_CHARACTERS}.
     */
    private static String generateCode() {
        StringBuilder builder = new StringBuilder();
        while (builder.length() < CODE_LENGTH) {
            int index = (int) (Math.random() * CODE_CHARACTERS.length());
            builder.append(CODE_CHARACTERS.charAt(index));
        }
        return builder.toString();
    }

    //</editor-fold>

    /////// Websocket Handling
    //<editor-fold desc="Websocket Handling">

    /**
     * Called when a websocket connects to the server.
     * @param ctx the WsConnectContext of the websocket.
     * @requires the context must have the following parameters:
     *          {@code lobby}: a String representing the lobby code.
     *          {@code name}: a String username. Cannot already exist in the given lobby.
     * @effects Closes the websocket session if:
     *              400 if the {@code lobby} or {@code name} parameters are missing.
     *              404 if there is no lobby with the given code
     *              403 the username is invalid (there is already another user with that name in the lobby).
     *              488 if the lobby is currently in a game and the user is not a rejoining player.
     *              489 if the lobby is full.
     *          Otherwise, connects the user to the lobby.
     */
    private static void onWebsocketConnect(WsConnectContext ctx) {
        if (ctx.queryParam(PARAM_LOBBY) == null || ctx.queryParam(PARAM_NAME) == null) {
            System.out.println("A websocket request was missing a parameter and was disconnected.");
            ctx.session.close(400, "Must have the '" + PARAM_LOBBY + "' and '" + PARAM_NAME + "' parameters.");
            return;
        }

        String code = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);
        System.out.print("Attempting to connect user '" + name + "' to lobby '" + code + "': ");
        if (!codeToLobby.containsKey(code)) { // the lobby does not exist.
            System.out.println("FAILED (The lobby does not exist)");
            ctx.session.close(404, "The lobby '" + code + "' does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(code);
        if (lobby.hasUserWithName(name)) { // duplicate names not allowed
            System.out.println("FAILED (Repeat username)");
            ctx.session.close(403, "A user with the name " + name + " is already in the lobby.");
            return;
        } else if (lobby.isFull()) {
            System.out.println("FAILED (Lobby is full)");
            ctx.session.close(489, "The lobby " + code + " is currently full.");
            return;
        } else if (lobby.isInGame() && !lobby.canAddUserDuringGame(name)) {
            System.out.println("FAILED (Lobby in game)");
            ctx.session.close(488, "The lobby " + code + " is currently in a game..");
            return;
        }
        System.out.println("SUCCESS");
        lobby.addUser(ctx, name);
        userToLobby.put(ctx, lobby); // keep track of which lobby this connection is in.
        lobby.updateAllUsers();
    }


    /**
     * Parses a websocket message sent from the user.
     * @param ctx the WsMessageContext of the websocket.
     * @requires the context must have the following parameters:
     *          {@code lobby}: a String representing the lobby code.
     *          {@code name}: a String username. Cannot already exist in the given lobby.
     *          {@code command}: a String command.
     * @modifies this
     * @effects Ends the websocket command with code 400 if the specified lobby does not exist, the user is not allowed
     *          to make this action (usually because they are not a president/chancellor), if a required parameter is
     *          missing, or the command cannot be executed in this state.
     *          <p>
     *          Updates the game state according to the specified command and updates every other connected user
     *          with the new state.
     */
    private static void onWebSocketMessage(WsMessageContext ctx) {
        // Parse message to JSON object.
        JSONObject message = new JSONObject(ctx.message());

        if (message.getString(PARAM_LOBBY) == null
                || message.getString(PARAM_NAME) == null
                || message.getString(PARAM_COMMAND) == null) {
            System.out.println("Message request failed: missing a parameter.");
            ctx.session.close(400, "A required parameter is missing.");
            return;
        }

        String name = message.getString(PARAM_NAME);
        String lobbyCode = message.getString(PARAM_LOBBY);
        System.out.print("Received a message from user '" + name + "' in lobby '" + lobbyCode + "' (" + ctx.message() + "): ");

        if (!codeToLobby.containsKey(lobbyCode)) {
            System.out.println("FAILED (Lobby requested does not exist)");
            ctx.session.close(404, "The lobby does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(lobbyCode);

        if (!lobby.hasUser(ctx, name)) {
            System.out.println("FAILED (Lobby does not have the user)");
            ctx.session.close(403, "The user is not in the lobby " + lobbyCode + ".");
            return;
        }

        lobby.resetTimeout();

        boolean updateUsers = true; // this flag can be disabled by certain commands.
        try {
            switch (message.getString(PARAM_COMMAND)) {
                case COMMAND_PING:
                    updateUsers = false;
                    break;

                case COMMAND_START_GAME: // Starts the game.
                    lobby.startNewGame();
                    break;

                case COMMAND_GET_STATE: // Requests the updated state of the game.
                    lobby.updateUser(ctx);
                    break;

                case COMMAND_NOMINATE_CHANCELLOR: // params: PARAM_TARGET (String)
                    verifyIsPresident(name, lobby);
                    lobby.game().nominateChancellor(message.getString(PARAM_TARGET));
                    break;

                case COMMAND_REGISTER_VOTE: // params: PARAM_VOTE (boolean)
                    boolean vote = message.getBoolean(PARAM_VOTE);
                    lobby.game().registerVote(name, vote);
                    break;

                case COMMAND_REGISTER_PRESIDENT_CHOICE: // params: PARAM_CHOICE (int)
                    verifyIsPresident(name, lobby);
                    int discard = message.getInt(PARAM_CHOICE);
                    lobby.game().presidentDiscardPolicy(discard);
                    break;

                case COMMAND_REGISTER_CHANCELLOR_CHOICE: // params: PARAM_CHOICE (int)
                    verifyIsChancellor(name, lobby);
                    int enact = message.getInt(PARAM_CHOICE);
                    lobby.game().chancellorEnactPolicy(enact);
                    break;

                case COMMAND_REGISTER_CHANCELLOR_VETO:
                    verifyIsChancellor(name, lobby);
                    lobby.game().chancellorVeto();

                case COMMAND_REGISTER_PRESIDENT_VETO: // params: PARAM_VETO (boolean)
                    verifyIsPresident(name, lobby);
                    boolean veto = message.getBoolean(PARAM_VETO);
                    lobby.game().presidentialVeto(veto);
                    break;

                case COMMAND_REGISTER_EXECUTION: // params: PARAM_TARGET (String)
                    verifyIsPresident(name, lobby);
                    lobby.game().executePlayer(message.getString(PARAM_TARGET));
                    break;

                case COMMAND_REGISTER_SPECIAL_ELECTION: // params: PARAM_TARGET (String)
                    verifyIsPresident(name, lobby);
                    lobby.game().electNextPresident(message.getString(PARAM_TARGET));
                    break;

                case COMMAND_GET_INVESTIGATION: // params: PARAM_TARGET (String)
                    verifyIsPresident(name, lobby);
                    Identity id = lobby.game().investigatePlayer(message.getString(PARAM_TARGET));
                    // Construct and send a JSONObject.
                    JSONObject obj = new JSONObject();
                    obj.put(PARAM_PACKET_TYPE, PACKET_INVESTIGATION);
                    if (id == Identity.FASCIST) {
                        obj.put(PARAM_INVESTIGATION, FASCIST);
                    } else {
                        obj.put(PARAM_INVESTIGATION, LIBERAL);
                    }
                    ctx.send(obj.toString());
                    break;

                case COMMAND_REGISTER_PEEK:
                    verifyIsPresident(name, lobby);
                    lobby.game().endPeek();
                    break;

                case COMMAND_END_TERM:
                    verifyIsPresident(name, lobby);
                    lobby.game().endPresidentialTerm();
                    break;

                default: //This is an invalid command.
                    throw new RuntimeException("FAILED (unrecognized command " + message.get(PARAM_COMMAND) + ")");
            }

            System.out.println("SUCCESS");
            JSONObject msg = new JSONObject();
            msg.put(PARAM_PACKET_TYPE, PACKET_OK);
            ctx.send(msg.toString());

        } catch (NullPointerException e) {
            System.out.println("FAILED (" + e.toString() + ")");
            ctx.session.close(400, "NullPointerException:" + e.toString());
        } catch (RuntimeException e) {
            System.out.println("FAILED (" + e.toString() + ")");
            ctx.session.close(400, "RuntimeException:" + e.toString());
        }
        if (updateUsers) {
            lobby.updateAllUsers();
        }
    }

    /**
     * Verifies that the user is the president.
     * @param name String name of the user.
     * @param lobby the Lobby that the game is in.
     * @throws RuntimeException if the user is not the president.
     */
    private static void verifyIsPresident(String name, Lobby lobby) {
        if (!lobby.game().getCurrentPresident().equals(name)) {
            throw new RuntimeException("The player '" + name + "' is not currently president.");
        }
    }

    /**
     * Verifies that the user is the chancellor.
     * @param name String name of the user.
     * @param lobby the Lobby that the game is in.
     * @throws RuntimeException if the user is not the chancellor.
     */
    private static void verifyIsChancellor(String name, Lobby lobby) {
        if (!lobby.game().getCurrentChancellor().equals(name)) {
            throw new RuntimeException("The player '" + name + "' is not currently chancellor.");
        }
    }

    /**
     * Called when a websocket is closed.
     * @param ctx the WsContext of the websocket.
     * @modifies this
     * @effects Removes the user from any connected lobbies. If the user was the last active user in the lobby,
     *          shuts down the lobby.
     */
    private static void onWebSocketClose(WsCloseContext ctx) {
        if (userToLobby.containsKey(ctx)) {
            Lobby lobby = userToLobby.get(ctx);
            if (lobby.hasUser(ctx)) {
                lobby.removeUser(ctx);
                lobby.updateAllUsers();
            }
            userToLobby.remove(ctx);
        }
    }

    //</editor-fold>

}
