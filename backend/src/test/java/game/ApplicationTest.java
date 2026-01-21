package game;

import server.ApplicationConfig;
import server.SecretHitlerServer;

public class ApplicationTest {
    public static void main(String[] args) {
        ApplicationConfig.DEBUG = true;
        SecretHitlerServer.main(args);
    }
}
