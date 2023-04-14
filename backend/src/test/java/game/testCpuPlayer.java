package game;

import game.datastructures.Identity;
import game.datastructures.Player;
import org.junit.Test;
import org.junit.Rule;
import org.junit.rules.Timeout;
import static junit.framework.TestCase.*;
import static org.junit.Assert.assertNotEquals;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

public class testCpuPlayer {
  static int ITERATIONS = 100000;

  @Rule
  public Timeout globalTimeout = Timeout.seconds(100);

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
    List<String> players = makePlayers(5);
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
    assertTrue(max - min < ITERATIONS / numPlayers);
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
      cpu.act(game);
      assertEquals(game.getState(), GameState.CHANCELLOR_VOTING);
    }
  }

  @Test
  public void testCanPlayFullGame() {
    Random random = new Random();
    HashMap<GameState, Integer> winTypes = new HashMap<>();

    for (int i = 0; i < ITERATIONS; i++) {
      List<String> players = makePlayers(random.nextInt(6) + 5);
      Collections.shuffle(players);
      SecretHitlerGame game = new SecretHitlerGame(players);

      // Mark all as CPUs
      List<CpuPlayer> cpus = new ArrayList<CpuPlayer>();
      for (String player : players) {
        CpuPlayer cpu = new CpuPlayer(player);
        cpu.initialize(game);
        cpus.add(cpu);
      }

      // Run through the game until a victory state is achieved
      while (!game.hasGameFinished()) {
        for (CpuPlayer cpu : cpus) {
          cpu.update(game);
        }
        for (CpuPlayer cpu : cpus) {
          try {

            if (cpu.act(game)) {
              break;
            }
          } catch (Exception e) {
            System.out.println("players: " + game.getPlayerList().size());
            System.out.println("draw: " + game.getDrawSize());
            System.out.println("discard: " + game.getDiscardSize());
            System.out.println("fascist: " + game.getNumFascistPolicies());
            System.out.println("liberal: " + game.getNumLiberalPolicies());
            System.out.println("state: " + game.getState());
            throw e;
          }
        }
      }

      // Register victory types and conditions
      if (!winTypes.containsKey(game.getState())) {
        winTypes.put(game.getState(), 0);
      }
      winTypes.put(game.getState(), winTypes.get(game.getState()) + 1);
    }

    List<GameState> states = new ArrayList<>(winTypes.keySet());
    Collections.sort(states);
    for (GameState state : states) {
      System.out.println("" + state.toString() + ": "
        + (winTypes.get(state) * 1f / ITERATIONS * 100f) + "%");
    }
  }
}
