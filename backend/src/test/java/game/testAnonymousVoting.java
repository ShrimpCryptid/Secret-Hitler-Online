package game;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;
import org.junit.Test;

import game.datastructures.Player;
import server.util.GameToJSONConverter;

public class testAnonymousVoting {

    private static SecretHitlerGame gameInVoting() {
        List<String> names = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            names.add(Integer.toString(i));
        }
        SecretHitlerGame game = new SecretHitlerGame(names);
        game.nominateChancellor("2");
        assertEquals(GameState.CHANCELLOR_VOTING, game.getState());
        return game;
    }

    private static void assertNoIndividualVotes(JSONObject state) {
        JSONObject votes = state.getJSONObject("userVotes");
        for (String voter : votes.keySet()) {
            assertTrue("vote for " + voter + " leaked", votes.isNull(voter));
        }
    }

    @Test
    public void hidesVotesAndTotalsWhileVoting() {
        SecretHitlerGame game = gameInVoting();
        game.registerVote("0", true);
        game.registerVote("1", false);

        JSONObject state = GameToJSONConverter.convert(game, "0", true);

        assertTrue(state.getBoolean("anonymousVoting"));
        assertEquals(2, state.getJSONObject("userVotes").length());
        assertNoIndividualVotes(state);
        assertFalse(state.has("voteTotals"));
    }

    @Test
    public void revealsOnlyTotalsAfterVoting() {
        SecretHitlerGame game = gameInVoting();
        boolean[] ballots = {true, true, true, false, false};
        List<Player> players = game.getPlayerList();
        for (int i = 0; i < players.size(); i++) {
            game.registerVote(players.get(i).getUsername(), ballots[i]);
        }

        JSONObject state = GameToJSONConverter.convert(game, "0", true);

        assertNoIndividualVotes(state);
        JSONObject totals = state.getJSONObject("voteTotals");
        assertEquals(3, totals.getInt("yes"));
        assertEquals(2, totals.getInt("no"));
    }

    @Test
    public void standardModeStillRevealsVotes() {
        SecretHitlerGame game = gameInVoting();
        game.registerVote("0", true);

        JSONObject state = GameToJSONConverter.convert(game, "0", false);

        assertFalse(state.getBoolean("anonymousVoting"));
        assertTrue(state.getJSONObject("userVotes").getBoolean("0"));
        assertFalse(state.has("voteTotals"));
    }
}
