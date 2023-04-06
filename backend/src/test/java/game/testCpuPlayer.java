package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;
import static junit.framework.TestCase.*;
import static org.junit.Assert.assertNotEquals;

import java.util.ArrayList;
import java.util.List;

public class testCpuPlayer {
  static int ITERATIONS = 100;

  private ArrayList<String> makePlayers(int numPlayers) {
    ArrayList<String> out = new ArrayList<>();
    for (int i = 0; i < numPlayers; i++) {
        out.add(Integer.toString(i));
    }
    return out;
  }

  private String getPlayerOfIdentity(SecretHitlerGame game, Identity id) {
    for (Player player : game.getPlayerList()) {
      if (player.getIdentity() == id) {
        return player.getUsername();
      }
    }
    return null;
  }

  @Test
  public void testSelectingRandomPlayerDoesNotChooseSelf() {
    List<String> players = makePlayers(6);
    SecretHitlerGame game = new SecretHitlerGame(players);

    CpuPlayer cpu = new CpuPlayer(players.get(0));
    cpu.initialize(game);

    for (int i = 0; i < ITERATIONS; i++) {
      String selectedName = cpu.chooseRandomPlayerWeighted(game.getPlayerList(),
        1f,
        1f,
        1f,
        0f);
      assertNotNull(selectedName);
      assertNotEquals(cpu.myName, selectedName);
    }
  }

  @Test
  public void testSelectingRandomPlayerIgnoresZeroProbability() {
    List<String> players = makePlayers(8);
    SecretHitlerGame game = new SecretHitlerGame(players);

    CpuPlayer cpu = new CpuPlayer(getPlayerOfIdentity(game, Identity.LIBERAL));
    cpu.initialize(game);

    String hitler = getPlayerOfIdentity(game, Identity.HITLER);

    for (int i = 0; i < ITERATIONS; i++) {
      String selectedName = cpu.chooseRandomPlayerWeighted(game.getPlayerList(),
        1f,
        0f,
        1f,
        0f);
      assertNotNull(selectedName);
      assertNotEquals(cpu.myName, selectedName);
      assertNotEquals(hitler, selectedName);
    }
  }

  @Test
  public void testBiasesTowardsPlayers() {
    List<String> players = makePlayers(8);
    SecretHitlerGame game = new SecretHitlerGame(players);

    CpuPlayer cpu = new CpuPlayer(getPlayerOfIdentity(game, Identity.LIBERAL));
    cpu.initialize(game);

    String randomPlayer = getPlayerOfIdentity(game, Identity.FASCIST);
    // Mark every other player as a CPU
    for (Player player : game.getPlayerList()) {
      if (!player.getUsername().equals(randomPlayer)) {
        player.markAsCpu();
      }
    }

    for (int i = 0; i < ITERATIONS; i++) {
      String selectedName = cpu.chooseRandomPlayerWeighted(game.getPlayerList(),
        0f,
        0f,
        0f,
        0.5f);
      assertEquals(randomPlayer, selectedName);
    }
  }

  @Test
  public void testCanNominateChancellor() {
    List<String> players = makePlayers(8);
    for (int i = 0; i < ITERATIONS; i++) {
      SecretHitlerGame game = new SecretHitlerGame(players);
      CpuPlayer cpu = new CpuPlayer(game.getCurrentPresident());
      cpu.initialize(game);
      cpu.onUpdate(game);
      assertEquals(game.getState(), GameState.CHANCELLOR_VOTING);
    }
  }
}
