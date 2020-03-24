package server;

import game.GameState;
import game.SecretHitlerGame;
import game.datastructures.Identity;
import game.datastructures.Policy;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.websocket.WsCloseContext;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsMessageContext;
import org.eclipse.jetty.websocket.api.CloseStatus;
import org.json.JSONObject;
import server.util.Lobby;

import java.util.Map;
import java.util.Objects;
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
    public static final String PARAM_IDENTITY = "identity";
    public static final String PARAM_PEEK = "peek";
    public static final String PARAM_TYPE = "type";

    // These specify the kind of JSON Object being sent to the client.
    public static final String TYPE_INVESTIGATION = "investigation";
    public static final String TYPE_PEEK = "peek";
    public static final String FASCIST = "fascist";
    public static final String LIBERAL = "liberal";

    // These are the commands that can be passed via a websocket connection.
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
    public static final String COMMAND_GET_PEEK = "get-peek";

    public static final String COMMAND_END_TERM = "end-term";


    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;

    //</editor-fold>

    ///// Private Fields
    // <editor-fold desc="Private Fields">

    private static Map<WsContext, Lobby> userToLobby = new ConcurrentHashMap<>();
    private static Map<String, Lobby> codeToLobby = new ConcurrentHashMap<>();
    private static Map<Lobby, String> lobbyToCode = new ConcurrentHashMap<>();

    // </editor-fold>

    ////// Private Classes



    public static void main(String[] args) {

        Javalin serverApp = Javalin.create().start(PORT_NUMBER);

        serverApp.get("/check-login", SecretHitlerServer::checkLogin); // Checks if a login is valid.
        serverApp.get("/new-lobby", SecretHitlerServer::createNewLobby); // Creates and returns the code for a new lobby

        serverApp.ws("/game", wsHandler -> {
            wsHandler.onConnect(SecretHitlerServer::onWebsocketConnect);
            wsHandler.onMessage(SecretHitlerServer::onWebSocketMessage);
            wsHandler.onClose(SecretHitlerServer::onWebSocketClose);
        });
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
     *          <p>- 200: Success. There is a lobby with the given name and the user can open a websocket connection with
     *              these login credentials.
     */
    public static void checkLogin(Context ctx) {
        String lobbyCode = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);
        if (lobbyCode == null || name == null) {
            ctx.status(400);
            ctx.result("Requires lobby and name parameters");
        }

        if (!codeToLobby.containsKey(lobbyCode)) { // lobby does not exist
            ctx.status(404);
            ctx.result("No such lobby found.");
        } else { // the lobby exists
            Lobby lobby = codeToLobby.get(lobbyCode);

            if (lobby.hasUsername(name)) { // repeat username.
                ctx.status(403);
                ctx.result("There is already a user with the name " + name + " in the lobby.");
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
        String newCode = generateCode();
        while(codeToLobby.containsKey(newCode)) {
            newCode = generateCode();
        }

        Lobby lobby = new Lobby();
        codeToLobby.put(newCode, lobby); // add a new lobby with the given code.
        lobbyToCode.put(lobby, newCode);

        ctx.status(200);
        ctx.result(newCode);
        System.out.println("New lobby: " + newCode);
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
     *          Otherwise, connects the user to the lobby.
     */
    private static void onWebsocketConnect(WsConnectContext ctx) {
        System.out.println("New connection " + ctx.toString());
        if (ctx.queryParam(PARAM_LOBBY) == null || ctx.queryParam(PARAM_NAME) == null) {
            ctx.session.close(400, "Must have the '" + PARAM_LOBBY + "' and '" + PARAM_NAME + "' parameters.");
            return;
        }

        String code = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);
        if (!codeToLobby.containsKey(ctx.queryParam(PARAM_LOBBY))) { // the lobby does not exist.
            ctx.session.close(404, "The lobby '" + ctx.queryParam(PARAM_LOBBY) + "' does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(code);
        if (lobby.hasUsername(name)) { // duplicate names not allowed
            ctx.session.close(403, "A user with the name " + name + " is already in the lobby.");
            return;
        }

        lobby.addUser(ctx, name);
        userToLobby.put(ctx, lobby); // keep track of which lobby this connection is in.
        System.out.println("Successfully connected with user " + name);

        if (lobby.isInGame()) { // updates the user (in case they are a spectator)
            lobby.updateUser(ctx);
        }
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
            System.out.println("Missing a parameter.");
            ctx.session.close(400, "A required parameter is missing.");
            return;
        } else if (!codeToLobby.containsKey(message.get(PARAM_LOBBY))) {
            System.out.println("Lobby requested does not exist.");
            ctx.session.close(404, "The lobby does not exist.");
            return;
        }

        String lobbyCode = message.getString(PARAM_LOBBY);
        Lobby lobby = codeToLobby.get(lobbyCode);
        String name = message.getString(PARAM_NAME);

        if (!lobby.hasUser(ctx)) {
            System.out.println("Lobby does not have user.");
            ctx.session.close(403, "The user is not connected to the lobby " + lobbyCode + ".");
            return;
        } else if (!lobby.hasUsername(name)) {
            ctx.session.close(403, "The name of the user making this request is not in the lobby " + lobbyCode + ".");
            return;
        }

        try {
            switch (message.getString(PARAM_COMMAND)) {
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
                    obj.put(PARAM_TYPE, TYPE_INVESTIGATION);
                    if (id == Identity.FASCIST) {
                        obj.put(PARAM_IDENTITY, FASCIST);
                    } else {
                        obj.put(PARAM_IDENTITY, LIBERAL);
                    }
                    ctx.send(obj);
                    break;

                case COMMAND_GET_PEEK:
                    verifyIsPresident(name, lobby);
                    Policy[] policies = lobby.game().getPeek();
                    // Turn Policy array into a String array
                    String[] stringPolicies = new String[policies.length];
                    for (int i = 0; i < policies.length; i++) {
                        if (policies[i].getType() == Policy.Type.FASCIST) {
                            stringPolicies[i] = FASCIST;
                        } else {
                            stringPolicies[i] = LIBERAL;
                        }
                    }
                    // Construct and send JSONObject
                    JSONObject msg = new JSONObject();
                    msg.put(PARAM_TYPE, TYPE_PEEK);
                    msg.put(PARAM_PEEK, stringPolicies);
                    ctx.send(msg);
                    break;

                case COMMAND_END_TERM:
                    verifyIsPresident(name, lobby);
                    lobby.game().endPresidentialTerm();

                default: //This is an invalid command.
                    throw new RuntimeException("Unrecognized command " + message.get(PARAM_COMMAND) + ".");

            }
        } catch (NullPointerException e) {
            System.out.println(e.toString());
            ctx.session.close(400, "NullPointerException:" + e.toString());
        } catch (RuntimeException e) {
            System.out.println(e.toString());
            ctx.session.close(400, "RuntimeException:" + e.toString());
        }
        System.out.println("Active users in lobby " + lobbyToCode.get(lobby) + ": " + lobby.getActiveUserCount());
        lobby.updateAllUsers();
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
        // if this is the last connection in a lobby, delete the lobby.
        if (userToLobby.containsKey(ctx)) {
            Lobby lobby = userToLobby.get(ctx);
            if (lobby.hasUser(ctx)) {
                lobby.removeUser(ctx);
                if (lobby.getActiveUserCount() == 0) { // Lobby is now empty; remove references for Java GC.
                    String code = lobbyToCode.get(lobby);
                    lobbyToCode.remove(lobby);
                    codeToLobby.remove(code);
                }
            }
            userToLobby.remove(ctx);
        }
    }

    //</editor-fold>

}
