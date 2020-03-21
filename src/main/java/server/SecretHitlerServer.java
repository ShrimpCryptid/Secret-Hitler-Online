package server;

import game.SecretHitlerGame;
import io.javalin.Javalin;
import io.javalin.websocket.WsContext;
import server.util.Lobby;

import java.util.Map;

public class SecretHitlerServer {


    ////// Static Fields
    // <editor-fold desc="Static Fields">

    private static final int PORT_NUMBER = 4000;

    //</editor-fold>

    ///// Private Fields
    // <editor-fold desc="Private Fields">

    private Map<String, SecretHitlerGame> activeGames;
    private Map<WsContext, Lobby> userToLobby;

    // </editor-fold>

    ////// Private Classes



    public static void main(String[] args) {
        Javalin serverApp = Javalin.create().start(PORT_NUMBER);
        serverApp.ws("/game", wsHandler -> {
            wsHandler.onConnect(ctx -> onWebsocketConnect(ctx));
            wsHandler.onMessage(ctx -> onWebSocketMessage(ctx));
            wsHandler.onClose(ctx -> onWebSocketClose(ctx));
        });

    }

    /////// Websocket Handling
    //<editor-fold desc="Websocket Handling">

    private static void onWebsocketConnect(WsContext ctx) {

    }

    private static void onWebSocketMessage(WsContext ctx) {

    }

    private static void onWebSocketClose(WsContext ctx) {

    }

    //</editor-fold>

    ///////// Game Management
    //<editor-fold desc="Game Management">
    //</editor-fold>

}
