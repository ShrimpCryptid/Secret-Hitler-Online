package server.util;

import game.GameState;
import game.SecretHitlerGame;
import game.datastructures.Player;
import game.datastructures.Policy;
import org.json.JSONObject;

import java.util.List;

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
     *          {@code player-order}: an array of names representing the order of the players in the game.
     *
     *          {@code players}: a JSONObject map, with keys that are a player's {@code username}.
     *              Each {@code username} key maps to an object with the properties {@code id} (String),
     *              {@code alive} (boolean), and {@code investigated} (boolean), to represent the player.
     *              The identity is either this.HITLER, this.FASCIST, or this.LIBERAL.
     *              Ex: {"player1":{"alive": true, "investigated": false, "id": "LIBERAL"}}.
     *
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
        JSONObject playerData = new JSONObject();
        String[] playerOrder = new String[game.getPlayerList().size()];
        List<Player> playerList = game.getPlayerList();

        for (int i = 0; i < playerList.size(); i++) {
            JSONObject playerObj = new JSONObject();
            Player player = playerList.get(i);

            playerObj.put("alive", player.isAlive());

            String id = LIBERAL;
            if (player.isHitler()) {
                id = HITLER;
            } else if (player.isFascist()) {
                id = FASCIST;
            }
            playerObj.put("id", id);
            playerObj.put("investigated", player.hasBeenInvestigated());

            playerData.put(player.getUsername(), playerObj);
            playerOrder[i] = player.getUsername();
        }

        out.put("players", playerData);
        out.put("player-order", playerOrder);

        out.put("president", game.getCurrentPresident());
        out.put("chancellor", game.getCurrentChancellor());
        out.put("state", game.getState().toString());
        out.put("last-state", game.getLastState().toString());
        out.put("last-president", game.getLastPresident());
        out.put("last-chancellor", game.getLastChancellor());
        out.put("target-user", game.getTarget());

        out.put("election-tracker", game.getElectionTracker());
        out.put("election-tracker-advanced", game.didElectionTrackerAdvance());

        out.put("draw-size", game.getDrawSize());
        out.put("discard-size", game.getDiscardSize());
        out.put("fascist-policies", game.getNumFascistPolicies());
        out.put("liberal-policies", game.getNumLiberalPolicies());
        out.put("user-votes", game.getVotes());

        if (game.getState() == GameState.LEGISLATIVE_PRESIDENT) {
            out.put("president-choices", convertPolicyListToStringArray(game.getPresidentLegislativeChoices()));
        }
        if (game.getState() == GameState.LEGISLATIVE_CHANCELLOR) {
            out.put("chancellor-choices", convertPolicyListToStringArray(game.getChancellorLegislativeChoices()));
        }

        return out;
    }

    /**
     * Converts a list of policies into a string array.
     * @param list the list of policies.
     * @return a string array with the same length as the list, where each index is either "FASCIST" or "LIBERAL"
     *         according to the type of the Policy at that index in the list.
     */
    public static String[] convertPolicyListToStringArray(List<Policy> list) {
        String[] out = new String[list.size()];
        for(int i = 0; i < list.size(); i++) {
            out[i] = list.get(i).getType().toString();
        }
        return out;
    }
}
