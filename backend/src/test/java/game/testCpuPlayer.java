package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;
import static junit.framework.TestCase.*;
import static org.junit.Assert.assertNotEquals;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class testCpuPlayer {
  static int ITERATIONS = 1000;

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
  public void testSelectingRandomPlayersChoosesAll() {
    int numPlayers = 10;
    List<String> players = makePlayers(10);
    SecretHitlerGame game = new SecretHitlerGame(players);

    CpuPlayer cpu = new CpuPlayer(getPlayerOfIdentity(game, Identity.FASCIST));
    HashMap<String, Integer> playerChosenCount = new HashMap<>();
    for (String playerName : players) {
      playerChosenCount.put(playerName, 0);
    }
    cpu.initialize(game);

    for (int i = 0; i < ITERATIONS; i++) {
      String selectedName = cpu.chooseRandomPlayerWeighted(game.getPlayerList(),
        1f,
        1f,
        1f,
        0f);
      playerChosenCount.put(selectedName, playerChosenCount.get(selectedName) + 1);
    }

    // Check that no values are negative
    int min = Integer.MAX_VALUE;
    int max = Integer.MIN_VALUE;
    for (String name : players) {
      if (name.equals(cpu.myName)) {
        continue;
      }
      int count = playerChosenCount.get(name);
      min = Math.min(count, min);
      max = Math.max(count, max);
      assertNotEquals(count, 0);
    }

    // Values are random, but ensure they're within a bounded range from one
    // another
    assertTrue(max - min < (numPlayers * numPlayers));
  }

  @Test
  public void testSelectingRandomPlayerIgnoresZeroProbability() {
    List<String> players = makePlayers(8);
    SecretHitlerGame game = new SecretHitlerGame(players);

    CpuPlayer cpu = new CpuPlayer(getPlayerOfIdentity(game, Identity.FASCIST));
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
