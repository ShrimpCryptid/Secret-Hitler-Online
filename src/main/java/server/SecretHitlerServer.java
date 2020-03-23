package server;

import game.SecretHitlerGame;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsMessageContext;
import server.util.Lobby;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListSet;

public class SecretHitlerServer {


    ////// Static Fields
    // <editor-fold desc="Static Fields">

    private static final int PORT_NUMBER = 4000;
    private static final String QUERY_LOBBY = "lobby";
    private static final String QUERY_NAME = "name";
    private static final String QUERY_COMMAND = "command";

    // These are the commands that can be passed via a websocket connection.
    private static final String COMMAND_GET_STATE = "get-state";

    private static final String COMMAND_NOMINATE_CHANCELLOR = "nominate-chancellor";
    private static final String COMMAND_REGISTER_VOTE = "register-vote";

    private static final String COMMAND_REGISTER_PRESIDENT_CHOICE = "register-president-choice";
    private static final String COMMAND_REGISTER_CHANCELLOR_CHOICE = "register-chancellor-choice";
    private static final String COMMAND_REGISTER_CHANCELLOR_VETO = "chancellor-veto";
    private static final String COMMAND_REGISTER_PRESIDENT_VETO = "president-veto";

    private static final String COMMAND_REGISTER_EXECUTION = "register-execution";
    private static final String COMMAND_REGISTER_SPECIAL_ELECTION = "register-special-election";
    private static final String COMMAND_GET_INVESTIGATION = "get-investigation";
    private static final String COMMAND_GET_PEEK = "get-peek";

    private static final String COMMAND_END_TERM = "end-term";



    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;

    //</editor-fold>

    ///// Private Fields
    // <editor-fold desc="Private Fields">

    private static Map<WsContext, Lobby> userToLobby = new ConcurrentHashMap<>();
    private static Map<String, Lobby> codeToLobby = new ConcurrentHashMap<>();

    // </editor-fold>

    ////// Private Classes



    public static void main(String[] args) {

        Javalin serverApp = Javalin.create().start(PORT_NUMBER);

        serverApp.get("/check-login", SecretHitlerServer::checkLogin); // Checks if a login is valid.
        serverApp.get("/new-lobby", SecretHitlerServer::createNewLobby); // Creates and returns the code for a new lobby

        serverApp.ws("/game/", wsHandler -> {
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
     *          400 if the {@code lobby} or {@code name} parameters are missing.
     *          404 if there is no lobby with the given code
     *          403 the username is invalid (there is already another user with that name in the lobby.)
     *          200 success. There is a lobby with the given name and the user can open a websocket connection with
     *              these login credentials.
     */
    public static void checkLogin(Context ctx) {
        String lobbyCode = ctx.queryParam(QUERY_LOBBY);
        String name = ctx.queryParam(QUERY_NAME);
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

        codeToLobby.put(newCode, new Lobby()); // add a new lobby with the given code.

        ctx.status(200);
        ctx.result(newCode);
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
        if (ctx.queryParam(QUERY_LOBBY) == null || ctx.queryParam(QUERY_NAME) == null) {
            ctx.session.close(400, "Must have the '" + QUERY_LOBBY + "' and '" + QUERY_NAME + "' parameters.");
            return;
        }

        String code = ctx.queryParam(QUERY_LOBBY);
        String name = ctx.queryParam(QUERY_NAME);
        if (!codeToLobby.containsKey(ctx.queryParam(QUERY_LOBBY))) { // the lobby does not exist.
            ctx.session.close(404, "The lobby '" + ctx.queryParam(QUERY_LOBBY) + "' does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(code);
        if (lobby.hasUsername(name)) { // duplicate names not allowed
            ctx.session.close(403, "A user with the name " + name + " is already in the lobby.");
            return;
        }

        lobby.addUser(ctx, name);
        userToLobby.put(ctx, lobby); // keep track of which lobby this connection is in.

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
     * @effects Ends the websocket command if:
     *              - 404: the lobby code is invalid.
     *              - 400: a required parameter is missing, or the command cannot be executed in this state.
     *          Updates the game state according to the specified command and updates every other connected user
     *          with the new state.
     */
    private static void onWebSocketMessage(WsMessageContext ctx) {
        if (ctx.queryParam(QUERY_LOBBY) == null || ctx.queryParam(QUERY_NAME) == null || ctx.queryParam(QUERY_COMMAND) == null) {

        }
    }


    private static void onWebSocketClose(WsContext ctx) {
        // if this is the last connection in a server, delete the server.
    }

    //</editor-fold>

    //////// Lobby Management

}
