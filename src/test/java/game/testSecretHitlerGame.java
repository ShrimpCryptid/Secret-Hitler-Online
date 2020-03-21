package game;

import game.datastructures.Player;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import static junit.framework.TestCase.*;

public class testSecretHitlerGame {

    private ArrayList<String> makePlayers(int numPlayers) {
        ArrayList<String> out = new ArrayList<>();
        for (int i = 0; i < numPlayers; i++) {
            out.add(Integer.toString(i));
        }
        return out;
    }

    @Test
    public void testGameFlow() {
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(6));

        assertEquals(game.getCurrentPresident(), "0");
        assertNull(game.getCurrentChancellor());
        assertEquals(game.getDrawSize(), SecretHitlerGame.NUM_FASCIST_POLICIES + SecretHitlerGame.NUM_LIBERAL_POLICIES);

        List<Player> playerList = game.getPlayerList();
        int fascistCount = 0;
        int liberalCount = 0;
        int hitlerCount = 0;
        for (Player player : playerList) {
            if (player.isHitler()) {
                hitlerCount++;
            } else if (player.isFascist()) {
                fascistCount++;
            } else {
                liberalCount++;
            }
            assertTrue(player.isAlive());
        }
        assertEquals(fascistCount, SecretHitlerGame.NUM_FASCISTS_FOR_PLAYERS[6]);
        assertEquals(hitlerCount, 1);
        assertEquals(liberalCount, playerList.size() - SecretHitlerGame.NUM_FASCISTS_FOR_PLAYERS[6] - 1);

        game.nominateChancellor("2");
        assertEquals(game.getState(), GameState.CHANCELLOR_VOTING);
    }

    ///////////////// Test Nomination and Voting
    // <editor-fold desc="Test Nomination and Voting">


    private void applyVotes(SecretHitlerGame game, Boolean[] votes) {
        List<Player> playerList = game.getPlayerList();
        for (int i = 0; i < playerList.size(); i++) {
            if (playerList.get(i).isAlive()) {
                game.registerVote(playerList.get(i).getUsername(), votes[i]);
            }
        }
    }

    @Test
    public void testVotingSplit(){
        SecretHitlerGame game = new SecretHitlerGame(makePlayers(5));
        game.nominateChancellor("1");

    }

    @Test
    public void testVotingAfterPlayerIsExecuted() {

    }

    //</editor-fold>
}
