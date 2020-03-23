package server;

import game.GameState;
import game.SecretHitlerGame;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsMessageContext;
import org.eclipse.jetty.websocket.api.CloseStatus;
import server.util.Lobby;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

public class SecretHitlerServer {


    ////// Static Fields
    // <editor-fold desc="Static Fields">

    public static final int PORT_NUMBER = 4000;


    public static final String PARAM_LOBBY = "lobby";
    public static final String PARAM_NAME = "name";
    public static final String PARAM_COMMAND = "command";
    public static final String PARAM_TARGET = "target-user";
    public static final String PARAM_VOTE = "vote";
    public static final String PARAM_CHOICE = "choice"; // the index of the chosen policy.


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
     *              - 404: the specified lobby does not exist.
     *              - 403: the user is not allowed to make this action. (Usually because they are not a president/chancellor).
     *              - 400: a required parameter is missing, or the command cannot be executed in this state.
     *          Updates the game state according to the specified command and updates every other connected user
     *          with the new state.
     */
    private static void onWebSocketMessage(WsMessageContext ctx) {
        if (ctx.queryParam(PARAM_LOBBY) == null || ctx.queryParam(PARAM_NAME) == null || ctx.queryParam(PARAM_COMMAND) == null) {
            ctx.session.close(400, "A required parameter is missing.");
            return;
        } else if (!codeToLobby.containsKey(ctx.queryParam(PARAM_LOBBY))) {
            ctx.session.close(404, "The lobby does not exist.");
            return;
        }

        String lobbyCode = ctx.queryParam(PARAM_LOBBY);
        Lobby lobby = codeToLobby.get(lobbyCode);
        String name = ctx.queryParam(PARAM_NAME);

        if (!lobby.hasUser(ctx)) {
            ctx.session.close(403, "The user is not connected to the lobby " + lobbyCode + ".");
            return;
        } else if (!lobby.hasUsername(name)) {
            ctx.session.close(403, "The name of the user making this request is not in the lobby " + lobbyCode + ".");
            return;
        }

        try {
            switch (Objects.requireNonNull(ctx.queryParam(PARAM_COMMAND))) {
                case COMMAND_START_GAME: // Starts the game.
                    lobby.startNewGame();
                    break;

                case COMMAND_GET_STATE: // Requests the updated state of the game.
                    lobby.updateUser(ctx);
                    break;

                case COMMAND_NOMINATE_CHANCELLOR: // params: PARAM_TARGET (String)
                    if (!onCommandNominateChancellor(ctx)) {
                        return; // the command failed.
                    }
                    break;

                case COMMAND_REGISTER_VOTE: // params: PARAM_VOTE (boolean)
                    if (!onRegisterVote(ctx)) {
                        return;
                    }
                    break;

                case COMMAND_REGISTER_PRESIDENT_CHOICE: // params: PARAM_CHOICE

                case COMMAND_REGISTER_CHANCELLOR_CHOICE: // params: PARAM_CHOICE

                case COMMAND_REGISTER_CHANCELLOR_VETO:

                case COMMAND_REGISTER_PRESIDENT_VETO:

                case COMMAND_REGISTER_EXECUTION: // params: PARAM_TARGET

                case COMMAND_REGISTER_SPECIAL_ELECTION: // params: PARAM_TARGET

                case COMMAND_GET_INVESTIGATION: // params: PARAM_TARGET

                case COMMAND_GET_PEEK:

                case COMMAND_END_TERM:

                default: //This is an invalid command.

            }
        } catch (NullPointerException e) {
            ctx.session.close(400, "NullPointerException:" + e.toString());
        } catch (RuntimeException e) {
            ctx.session.close(400, "RuntimeException:" + e.toString());
        }
        lobby.updateAllUsers();
    }

    // </editor-fold>

    private static void onWebSocketClose(WsContext ctx) {
        // if this is the last connection in a server, delete the server.
    }

    //</editor-fold>

}
