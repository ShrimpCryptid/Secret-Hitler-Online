package server.util;

import game.SecretHitlerGame;
import game.datastructures.Player;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Converts a SecretHitlerGame to a JSONObject that represents the game state.
 */
public class GameToJSONConverter {
    public static final String HITLER = "HITLER";
    public static final String FASCIST = "FASCIST";
    public static final String LIBERAL = "LIBERAL";

    /**
     * Creates a JSON object from a SecretHitlerGame that represents its state.
     * @param game the SecretHitlerGame to convert.
     * @throws NullPointerException if {@code game} is null.
     * @return a JSONObject with the following properties:
     *          {@code state}: the state of the game.
     *          {@code players}: an array of JSONObjects of players in the game.
     *              Each player has {@code username} (String), {@code identity} (String), and {@code alive} (boolean).
     *              The identity is either this.HITLER, this.FASCIST, or this.LIBERAL.
     *          {@code president}: the username of the current president.
     *          {@code chancellor}: the username of the current chancellor (can be null).
     *          {@code lastPresident}: The username of the last president that presided over a legislative session.
     *          {@code lastChancellor}: The username of the last chancellor that presided over a legislative session.
     *          {@code drawSize}: The size of the draw deck.
     *          {@code discardSize}: The size of the discard deck.
     *          {@code fascistPolicies}: The number of passed fascist policies.
     *          {@code liberalPolicies}: The number of passed liberal policies.:
     *          {@code userToVote}: A map from each user to their vote from the last chancellor nomination.
     */
    public static JSONObject convert(SecretHitlerGame game) {
        if (game == null) {
            throw new NullPointerException();
        }

        JSONObject out = new JSONObject();

        JSONArray playerArray = new JSONArray();
        for (Player player : game.getPlayerList()) {
            JSONObject playerObj = new JSONObject();
            playerObj.put("username", player.getUsername());
            playerObj.put("alive", player.isAlive());

            String id = LIBERAL;
            if (player.isHitler()) {
                id = HITLER;
            } else if (player.isFascist()) {
                id = FASCIST;
            }
            playerObj.put("identity", id);
        }

        out.put("players", playerArray);

        out.put("president", game.getCurrentPresident());
        out.put("chancellor", game.getCurrentChancellor());
        out.put("state", game.getState().toString());
        out.put("lastPresident", game.getLastPresident());
        out.put("lastChancellor", game.getLastChancellor());
        out.put("electionTracker", game.getElectionTracker());

        out.put("drawSize", game.getDrawSize());
        out.put("discardSize", game.getDiscardSize());
        out.put("fascistPolicies", game.getNumFascistPolicies());
        out.put("liberalPolicies", game.getNumLiberalPolicies());
        out.put("userToVote", game.getVotes());

        return out;
    }
}
