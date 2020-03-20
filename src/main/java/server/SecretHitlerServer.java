package server;

import game.SecretHitlerGame;
import io.javalin.Javalin;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsHandler;
import org.json.JSONObject;

import java.util.Map;

public class SecretHitlerServer {


    ////// Static Fields
    private static final int PORT_NUMBER = 4000;
    private static final int


    ///// Private Fields
    private Map<String, SecretHitlerGame> activeGames;
    private Map<WsContext, String> userToUsername;
    private Map<WsContext, SecretHitlerGame> userToGameName;

    public static void main(String[] args) {
        Javalin serverApp = Javalin.create().start(PORT_NUMBER);
        serverApp.ws("/game", wsHandler -> {
            wsHandler.onConnect(ctx -> onWebsocketConnect(ctx));
            wsHandler.onMessage(ctx -> onWebSocketMessage(ctx));
            wsHandler.onClose(ctx -> onWebSocketClose(ctx));
        });

    }

    private static void onWebsocketConnect(WsContext ctx) {


    }

    private static void onWebSocketMessage(WsContext ctx) {

    }

    private static JSONObject gameToJSON(SecretHitlerGame game) {
        JSONObject out = new JSONObject();
        out.put("players", game.getPlayerList());
        out.put("president", game.getCurrentPresident());
        out.put("chancellor", game.getCurrentChancellor());
        out.put("state", game.getState().toString());
        out.put("last_president", game.getLastPresident());
        out.put("last_chancellor", game.getLastChancellor());
    }

}
