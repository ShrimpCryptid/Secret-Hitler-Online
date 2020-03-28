package server.util;

import game.GameState;
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
     *              Each player has {@code username} (String), {@code identity} (String), {@code alive} (boolean),
     *              and {@code investigated} (boolean).
     *              The identity is either this.HITLER, this.FASCIST, or this.LIBERAL.
     *          {@code president}: the username of the current president.
     *          {@code chancellor}: the username of the current chancellor (can be null).
     *          {@code last-president}: The username of the last president that presided over a legislative session.
     *          {@code last-chancellor}: The username of the last chancellor that presided over a legislative session.
     *          {@code draw-size}: The size of the draw deck.
     *          {@code discard-size}: The size of the discard deck.
     *          {@code fascist-policies}: The number of passed fascist policies.
     *          {@code liberal-policies}: The number of passed liberal policies.:
     *          {@code user-votes}: A map from each user to their vote from the last chancellor nomination.
     *          {@code president-choices}: The choices for the president during the legislative session (only if in
     *                  game state LEGISLATIVE_PRESIDENT).
     *          {@code chancellor-choices}: The choices for the chancellor during the legislative session (only if in
     *                  game state LEGISLATIVE_CHANCELLOR).
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
            playerObj.put("investigated", player.hasBeenInvestigated());
            playerArray.put(playerObj);
        }

        out.put("players", playerArray);

        out.put("president", game.getCurrentPresident());
        out.put("chancellor", game.getCurrentChancellor());
        out.put("state", game.getState().toString());
        out.put("last-president", game.getLastPresident());
        out.put("last-chancellor", game.getLastChancellor());
        out.put("election-tracker", game.getElectionTracker());

        out.put("draw-size", game.getDrawSize());
        out.put("discard-size", game.getDiscardSize());
        out.put("fascist-policies", game.getNumFascistPolicies());
        out.put("liberal-policies", game.getNumLiberalPolicies());
        out.put("user-votes", game.getVotes());

        if (game.getState() == GameState.LEGISLATIVE_PRESIDENT) {
            out.put("president-choices", game.getPresidentLegislativeChoices());
        }
        if (game.getState() == GameState.LEGISLATIVE_CHANCELLOR) {
            out.put("chancellor-choices", game.getChancellorLegislativeChoices());
        }

        return out;
    }
}
