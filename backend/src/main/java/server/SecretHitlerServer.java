package server;

import game.datastructures.Identity;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.websocket.WsCloseContext;
import io.javalin.websocket.WsConnectContext;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsMessageContext;

import org.eclipse.jetty.websocket.api.StatusCode;
import org.json.JSONObject;
import server.util.Lobby;

import java.io.*;
import java.net.URI;
import java.sql.*;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class SecretHitlerServer {

    ////// Static Fields
    // <editor-fold desc="Static Fields">
    // TODO: Replace this with an environment variable or environment flag
    private static boolean DEBUG = false;
    public static final int DEFAULT_PORT_NUMBER = 4040;
    
    // Environmental Variable Names
    private static final String ENV_DEBUG = "DEBUG";
    private static final String ENV_DATABASE_URL = "DATABASE_URL";

    // Passed to server
    public static final String PARAM_LOBBY = "lobby";
    public static final String PARAM_NAME = "name";
    public static final String PARAM_COMMAND = "command";
    public static final String PARAM_TARGET = "target-user";
    public static final String PARAM_VOTE = "vote";
    public static final String PARAM_VETO = "veto";
    public static final String PARAM_CHOICE = "choice"; // the index of the chosen policy.
    public static final String PARAM_ICON = "icon";

    // Passed to client
    // The type of the packet tells the client how to parse the contents.
    public static final String PARAM_PACKET_TYPE = "type";
    public static final String PACKET_INVESTIGATION = "investigation";
    public static final String PACKET_GAME_STATE = "game";
    public static final String PACKET_LOBBY = "lobby";
    public static final String PACKET_OK = "ok"; // general response packet sent after any successful command.
    public static final String PACKET_PONG = "pong"; // response to pings.

    public static final String PARAM_INVESTIGATION = "investigation";
    public static final String FASCIST = "FASCIST";
    public static final String LIBERAL = "LIBERAL";

    // These are the commands that can be passed via a websocket connection.
    public static final String COMMAND_PING = "ping";
    public static final String COMMAND_START_GAME = "start-game";
    public static final String COMMAND_GET_STATE = "get-state";
    public static final String COMMAND_SET_LOBBY_SIZE = "set-lobby-size";
    public static final String COMMAND_SELECT_ICON = "select-icon";
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

    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTWXYZ"; // u,v characters can look ambiguous
    private static final int CODE_LENGTH = 4;

    private static final float UPDATE_FREQUENCY_MIN = 1;
    // </editor-fold>

    ///// Private Fields
    // <editor-fold desc="Private Fields">

    transient private static ConcurrentHashMap<WsContext, Lobby> userToLobby = new ConcurrentHashMap<>();
    private static ConcurrentHashMap<String, Lobby> codeToLobby = new ConcurrentHashMap<>();

    transient private static boolean hasLobbyChanged;

    // </editor-fold>

    ////// Private Methods

    private static int getHerokuAssignedPort() {
        if (DEBUG) {
            return DEFAULT_PORT_NUMBER;
        }
        String herokuPort = System.getenv("PORT");
        if (herokuPort != null) {
            return Integer.parseInt(herokuPort);
        }
        return DEFAULT_PORT_NUMBER;
    }

    public static void main(String[] args) {
        // On load, check the connected database to see if there's a stored state from
        // the server.
        loadDatabaseBackup();
        removeInactiveLobbies(); // immediately clean in case of redundant lobbies.

        // Only initialize Javalin communication after the database has been queried.
        Javalin serverApp = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
              if (DEBUG) {
                cors.add(it -> {
                  it.anyHost();
                });
              } else {
                cors.add(it -> {
                  it.allowHost("https://secret-hitler.online");
                });
              }
            });
        }).start(getHerokuAssignedPort());

        serverApp.get("/check-login", SecretHitlerServer::checkLogin); // Checks if a login is valid.
        serverApp.get("/new-lobby", SecretHitlerServer::createNewLobby); // Creates and returns the code for a new lobby
        serverApp.get("/ping", SecretHitlerServer::ping);

        serverApp.ws("/game", wsHandler -> {
            wsHandler.onConnect(SecretHitlerServer::onWebsocketConnect);
            wsHandler.onMessage(SecretHitlerServer::onWebSocketMessage);
            wsHandler.onClose(SecretHitlerServer::onWebSocketClose);
        });

        // Add hook for termination that backs up the lobbies to the database.
        Runtime.getRuntime().addShutdownHook(new Thread() {
            public void run() {
                System.out.println("Attempting to back up lobby data.");
                storeDatabaseBackup();
            }
        });

        // Add timer for periodic updates.
        int delay = 0;
        int period = (int) (UPDATE_FREQUENCY_MIN * 60.0f * 1000.0f);
        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                removeInactiveLobbies();
                // If there are active lobbies, store a backup of the game.
                if (!codeToLobby.isEmpty() && hasLobbyChanged) {
                    storeDatabaseBackup();
                    hasLobbyChanged = false;
                }
            }
        }, delay, period);
    }

    /**
     * Checks for and removes any lobbies that have timed out.
     * 
     * @effects For each lobby in the {@code codeToLobby} map, checks if the lobby
     *          has timed out.
     *          If so, closes all websockets associated with the lobby and removes
     *          them from the
     *          {@code userToLobby} map, then removes the lobby from the
     *          {@code codeToLobby} map.
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
                    ctx.session.close(StatusCode.NORMAL, "The lobby has timed out.");
                    userToLobby.remove(ctx);
                }
                removedLobbyCodes.add(entry.getKey());
                removedCount++;
                itr.remove();
            }
        }
        if (removedCount > 0) {
            System.out.println(String.format("Removed %d inactive lobbies: %s", removedCount, removedLobbyCodes));
            System.out.println("Available lobbies: " + codeToLobby.keySet());
            hasLobbyChanged = true;
        }
    }

    /////// Database Handling
    // <editor-fold desc="Database Handling">

    /**
     * Attempts to get a connection to the PostGres database.
     * 
     * @return null if no connection could be made.
     *         otherwise, returns a {@code java.sql.Connection} object.
     */
    private static Connection getDatabaseConnection() {
        // Get credentials from database or (if debug flag is set) via manual input.
        Connection c = null;
        try {
            URI databaseUri;
            if (DEBUG) {
                databaseUri = new URI("");
            } else {
                String envUri = System.getenv(ENV_DATABASE_URL);
                if (envUri == null) {
                  System.out.println("Could not connect to database: No ENV_DATABASE_URL environment variable provided.");
                  return null;
                }
                databaseUri = new URI(envUri);
            }
            String username = databaseUri.getUserInfo().split(":")[0];
            String password = databaseUri.getUserInfo().split(":")[1];
            String dbUrl = "jdbc:postgresql://" + databaseUri.getHost() + ':' + databaseUri.getPort()
                    + databaseUri.getPath();

            Class.forName("org.postgresql.Driver");
            c = DriverManager.getConnection(dbUrl, username, password);
            System.out.println("Successfully connected to database.");
            return c;
        } catch (Exception e) {
            System.out.println("Failed to connect to database.");
            System.err.println(e);
            return null;
        }
    }

    /**
     * Loads lobby data stored in the database (intended to be run on server wake).
     * 
     * @effects {@code codeToLobby} is set to the stored database
     */
    @SuppressWarnings("unchecked")
    private static void loadDatabaseBackup() {
        // Get connection to the Postgres Database and select the backup data.
        Connection c = getDatabaseConnection();
        if (c == null) {
            return;
        }
        Statement stmt = null;

        try {
            // Initialize table, just in case
            initializeDatabase(c);

            stmt = c.createStatement();
            ResultSet rs = stmt.executeQuery("select * from backup;");
            rs.next(); // Will fail if there are no entries in the table, which is fine.

            String timestamp = rs.getString("timestamp");
            int numAttempts = rs.getInt("attempts");
            byte[] lobbyBytes = rs.getBytes("lobby_bytes");
            System.out.println("Loaded backup from " + timestamp + ".");
            rs.close();
            stmt.close();

            // Update the number of attempts that have been made, for debugging.
            stmt = c.createStatement();
            stmt.executeUpdate("UPDATE backup SET attempts = '" + (numAttempts + 1) + "';");
            stmt.close();
            c.close();

            // Deserialize the data and convert to lobbies.
            // (Use try-with-resources to ensure streams are closed even if an error
            // occurs.)
            try (
                    ByteArrayInputStream lobbyByteStream = new ByteArrayInputStream(lobbyBytes);
                    ObjectInputStream objectStream = new ObjectInputStream(lobbyByteStream)) {
                codeToLobby = (ConcurrentHashMap<String, Lobby>) objectStream.readObject();
                objectStream.close();
                System.out.println("Successfully parsed lobby data from the database.");
            } catch (Exception e) {
                System.out.println("Failed to parse lobby data from stored backup. ");
                System.err.println(e.getClass().getName() + ": " + e.getMessage());
            }

        } catch (Exception e) {
            System.out.println("Failed to retrieve lobby backups from the database.");
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
        }
    }

    private static void storeDatabaseBackup() {
        ByteArrayOutputStream byteBuilder = new ByteArrayOutputStream();
        try {
            // Serialize the Lobby data.
            ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteBuilder);
            objectOutputStream.writeObject(codeToLobby);
            objectOutputStream.flush();
            objectOutputStream.close();
            byteBuilder.flush();
            // No need to close bytebuilder (close has no effect)
        } catch (Exception e) {
            System.out.println("Failed to serialize the Lobby data.");
            System.err.println(e);
            return;
        }
        byte[] lobbyData = byteBuilder.toByteArray();
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String timestamp = formatter.format(new Timestamp(System.currentTimeMillis()));
        int attempts = 0;

        Connection c = getDatabaseConnection();
        if (c == null) {
            return;
        }
        try {
            String queryStr = "INSERT INTO BACKUP (id, timestamp, attempts, lobby_bytes)" +
                    "VALUES (0, ?, ?, ?) " +
                    "ON CONFLICT (id) DO UPDATE " +
                    "SET timestamp = excluded.timestamp, " +
                    "attempts = excluded.attempts, " +
                    "lobby_bytes = excluded.lobby_bytes; ";
            PreparedStatement pstmt = c.prepareStatement(queryStr);
            int i = 1;
            pstmt.setString(i++, timestamp);
            pstmt.setInt(i++, attempts);
            pstmt.setBytes(i++, lobbyData);
            pstmt.executeUpdate();
            c.close();
        } catch (Exception e) {
            System.out.println("Failed to store the Lobby data in the database.");
            System.err.println(e);
            return;
        }
        System.out.println("Successfully saved Lobby state to the database.");
    }

    /**
     * Initializes the database by adding the BACKUP table.
     * 
     * @param c the connection to the database.
     * @effects the Postgres SQL datbase has a new
     */
    private static void initializeDatabase(Connection c) throws SQLException {
        Statement stmt = c.createStatement();
        stmt.executeUpdate("create table if not exists backup " +
                "(id INT UNIQUE, timestamp TEXT, attempts INT, lobby_bytes BYTEA);");
        stmt.close();
    }

    // </editor-fold>

    /////// Get Requests
    // <editor-fold desc="Get Requests">

    /**
     * Pings the server (intended to wake the inactive server)
     * 
     * @param ctx the context of the login request
     * @effects Returns the message "OK" with status code 200.
     */
    public static void ping(Context ctx) {
        ctx.status(200);
        ctx.result("OK");
    }

    /**
     * Determines whether a login is valid.
     * 
     * @param ctx the context of the login request.
     * @requires the context must have the following parameters:
     *           {@code lobby}: the code of the lobby.
     *           {@code name}: the username of the user.
     *           {@code command}: the command
     * @effects Result status is one of the following:
     *          <p>
     *          - 400: if the {@code lobby} or {@code name} parameters are
     *          missing (or blank).
     *          <p>
     *          - 404: if there is no lobby with the given code
     *          <p>
     *          - 403: the username is invalid (there is already another user
     *          with that name in the lobby.)
     *          <p>
     *          - 488: the lobby is currently in a game.
     *          <p>
     *          - 489: the lobby is full.
     *          <p>
     *          - 200: Success. There is a lobby with the given name and the
     *          user can open a websocket connection with these login
     *          credentials.
     */
    public static void checkLogin(Context ctx) {
        String lobbyCode = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);
        if (lobbyCode == null || name == null || name.isEmpty() || name.isBlank()) {
            ctx.status(400);
            ctx.result("Lobby and name must be specified.");
            return;
        }

        if (!codeToLobby.containsKey(lobbyCode)) { // lobby does not exist
            ctx.status(404);
            ctx.result("No such lobby found.");
        } else { // the lobby exists
            Lobby lobby = codeToLobby.get(lobbyCode);

            if (lobby.isFull()) {
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
     * 
     * @param ctx the HTTP get request context.
     */
    public static void createNewLobby(Context ctx) {
        removeInactiveLobbies();
        hasLobbyChanged = true;

        String newCode = generateCode();
        while (codeToLobby.containsKey(newCode)) {
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
     * 
     * @return a String code, with length specified by {@code this.CODE_LENGTH} and
     *         characters randomly
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

    // </editor-fold>

    /////// Websocket Handling
    // <editor-fold desc="Websocket Handling">

    /**
     * Called when a websocket connects to the server.
     * 
     * @param ctx the WsConnectContext of the websocket.
     * @requires the context must have the following parameters:
     *           {@code lobby}: a String representing the lobby code.
     *           {@code name}: a String username. Cannot already exist in the given
     *           lobby.
     * @effects Closes the websocket session if:
     *          <p>
     *          - 400 if the {@code lobby} or {@code name} parameters are missing.
     *          <p>
     *          - 404 if there is no lobby with the given code
     *          <p>
     *          - 403 the username is invalid (there is already another user
     *          with that name in the lobby).
     *          <p>
     *          - 488 if the lobby is currently in a game and the user is not
     *          a rejoining player.
     *          <p>
     *          - 489 if the lobby is full.
     *          <p>
     *          Otherwise, connects the user to the lobby.
     */
    private static void onWebsocketConnect(WsConnectContext ctx) {
        if (ctx.queryParam(PARAM_LOBBY) == null || ctx.queryParam(PARAM_NAME) == null) {
            System.out.println("A websocket request was missing a parameter and was disconnected.");
            ctx.session.close(StatusCode.PROTOCOL, "Must have the '" + PARAM_LOBBY + "' and '" + PARAM_NAME + "' parameters.");
            return;
        }

        // Sanitize user input
        String code = ctx.queryParam(PARAM_LOBBY);
        String name = ctx.queryParam(PARAM_NAME);

        if (code == null || name == null || name.isEmpty() || name.isBlank()) {
            System.out.println("FAILED (Lobby or name is empty/null)");
            ctx.session.close(StatusCode.PROTOCOL, "Lobby and name must be specified.");
        }

        System.out.print("Attempting to connect user '" + name + "' to lobby '" + code + "': ");
        if (!codeToLobby.containsKey(code)) { // the lobby does not exist.
            System.out.println("FAILED (The lobby does not exist)");
            ctx.session.close(StatusCode.PROTOCOL, "The lobby '" + code + "' does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(code);
        if (lobby.hasUserWithName(name)) { // duplicate names not allowed
            System.out.println("FAILED (Repeat username)");
            ctx.session.close(StatusCode.PROTOCOL, "A user with the name " + name + " is already in the lobby.");
            return;
        } else if (lobby.isFull()) {
            System.out.println("FAILED (Lobby is full)");
            ctx.session.close(StatusCode.PROTOCOL, "The lobby " + code + " is currently full.");
            return;
        } else if (lobby.isInGame() && !lobby.canAddUserDuringGame(name)) {
            System.out.println("FAILED (Lobby in game)");
            ctx.session.close(StatusCode.PROTOCOL, "The lobby " + code + " is currently in a game..");
            return;
        }
        System.out.println("SUCCESS");
        lobby.addUser(ctx, name);
        userToLobby.put(ctx, lobby); // keep track of which lobby this connection is in.
        lobby.updateAllUsers();
        hasLobbyChanged = true;
    }

    /**
     * Parses a websocket message sent from the user.
     * 
     * @param ctx the WsMessageContext of the websocket.
     * @requires the context must have the following parameters:
     *           {@code lobby}: a String representing the lobby code.
     *           {@code name}: a String username. Cannot already exist in the given
     *           lobby.
     *           {@code command}: a String command.
     * @modifies this
     * @effects Ends the websocket command with code 400 if the specified lobby does
     *          not exist, the user is not allowed
     *          to make this action (usually because they are not a
     *          president/chancellor), if a required parameter is
     *          missing, or the command cannot be executed in this state.
     *          <p>
     *          Updates the game state according to the specified command and
     *          updates every other connected user
     *          with the new state.
     */
    private static void onWebSocketMessage(WsMessageContext ctx) {
        // Parse message to JSON object.
        JSONObject message = new JSONObject(ctx.message());

        if (message.getString(PARAM_LOBBY) == null
                || message.getString(PARAM_NAME) == null
                || message.getString(PARAM_COMMAND) == null) {
            System.out.println("Message request failed: missing a parameter.");
            ctx.session.close(StatusCode.PROTOCOL, "A required parameter is missing.");
            return;
        }

        String name = message.getString(PARAM_NAME);
        String lobbyCode = message.getString(PARAM_LOBBY);

        String log_message = "Received a message from user '" + name + "' in lobby '" + lobbyCode + "' ("
                + ctx.message() + "): ";
        int log_length = log_message.length();
        System.out.print(log_message);

        if (!codeToLobby.containsKey(lobbyCode)) {
            System.out.println("FAILED (Lobby requested does not exist)");
            ctx.session.close(StatusCode.PROTOCOL, "The lobby does not exist.");
            return;
        }

        Lobby lobby = codeToLobby.get(lobbyCode);

        synchronized (lobby) {

            if (!lobby.hasUser(ctx, name)) {
                System.out.println("FAILED (Lobby does not have the user)");
                ctx.session.close(StatusCode.PROTOCOL, "The user is not in the lobby " + lobbyCode + ".");
                return;
            }

            lobby.resetTimeout();

            boolean updateUsers = true; // this flag can be disabled by certain commands.
            boolean sendOKMessage = true;
            try {
                switch (message.getString(PARAM_COMMAND)) {
                    case COMMAND_PING:
                        sendOKMessage = false;
                        updateUsers = false;
                        // Erase the previous line with spaces and \r
                        System.out.print("\r" + (' ' * log_length));
                        System.out.print("\r");
                        JSONObject msg = new JSONObject();
                        msg.put(PARAM_PACKET_TYPE, PACKET_PONG);
                        ctx.send(msg.toString());
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
                        break;

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

                    case COMMAND_SELECT_ICON:
                        String iconId = message.getString(PARAM_ICON);
                        lobby.trySetUserIcon(iconId, ctx);
                        break;

                    default: // This is an invalid command.
                        throw new RuntimeException("FAILED (unrecognized command " + message.get(PARAM_COMMAND) + ")");
                } // End switch

                if (sendOKMessage) {
                    System.out.println("SUCCESS");
                    JSONObject msg = new JSONObject();
                    msg.put(PARAM_PACKET_TYPE, PACKET_OK);
                    ctx.send(msg.toString());
                }

            } catch (NullPointerException e) {
                System.out.println("FAILED (" + e.toString() + ")");
                ctx.session.close(StatusCode.PROTOCOL, "NullPointerException:" + e.toString());
            } catch (RuntimeException e) {
                System.out.println("FAILED (" + e.toString() + ")");
                ctx.session.close(StatusCode.PROTOCOL, "RuntimeException:" + e.toString());
            }
            if (updateUsers) {
                lobby.updateAllUsers();
            }
        }
        hasLobbyChanged = true;
    }

    /**
     * Verifies that the user is the president.
     * 
     * @param name  String name of the user.
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
     * 
     * @param name  String name of the user.
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
     * 
     * @param ctx the WsContext of the websocket.
     * @modifies this
     * @effects Removes the user from any connected lobbies.
     */
    private static void onWebSocketClose(WsCloseContext ctx) {
        if (userToLobby.containsKey(ctx)) {
            Lobby lobby = userToLobby.get(ctx);
            synchronized (lobby) {
                if (lobby.hasUser(ctx)) {
                    lobby.removeUser(ctx);
                    lobby.updateAllUsers();
                }
            }
            userToLobby.remove(ctx);
        }
    }

    // </editor-fold>

}
