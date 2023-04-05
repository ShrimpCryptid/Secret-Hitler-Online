package game;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import game.datastructures.Identity;
import game.datastructures.Player;

public class CpuPlayer implements Serializable {

  /**
   * Tracks the current level of suspicion in a range from [0,10] that the
   * CpuPlayer has for each other player (both other CPUs and players) in the
   * game, starting at neutral (5). The higher the suspicion value is, the more
   * likely the CpuPlayer will act as though the player is Fascist/Hitler.
   */
  public final HashMap<String, Integer> playerSuspicion;

  /**
   * A map of player names to known roles. This is modified at the beginning of
   * the game, and by the Peek presidential power.
   */
  public final HashMap<String, Identity> knownPlayerRoles;

  /** The name of this CpuPlayer. */
  public final String myName;
  public Player myPlayerData;

  public CpuPlayer(String name) {
    this.myName = name;
    playerSuspicion = new HashMap<>();
    knownPlayerRoles = new HashMap<>();
  }

  public void initialize(SecretHitlerGame game, Set<String> players) {
    // Set player suspicion to neutral (5) by default
    playerSuspicion.clear();
    for (String player : players) {
      if (!player.equals(myName)) { // Don't add an entry for self
        playerSuspicion.put(player, 5);
      }
    }

    List<Player> playerList = game.getPlayerList();

    // Get a reference to our current player data
    myPlayerData = null;
    for (Player playerData : playerList) {
      if (playerData.getUsername().equals(myName)) {
        myPlayerData = playerData;
        break;
      }
    }
    if (myPlayerData == null) {
      throw new IllegalStateException(
          "Could not find a matching Player username in the current game while initializing this CpuPlayer.");
    }

    // Update known identities, based on identity, according to rules
    knownPlayerRoles.clear();
    if (myPlayerData.getIdentity() == Identity.FASCIST ||
        (myPlayerData.getIdentity() == Identity.HITLER && game.getPlayerList().size() <= 6)) {
      // Mark players as known if (1) player is fascist or (2) if player is
      // hitler AND there are only 5-6 players in the game.
      for (Player player : playerList) {
        if (!player.getUsername().equals(myName)) {
          // Add to known identities
          knownPlayerRoles.put(player.getUsername(), player.getIdentity());
        }
      }
    }
  }

  public void onUpdate(SecretHitlerGame game, Set<String> players) {
    // Do nothing if this CpuPlayer is dead (no actions required).
    if (!myPlayerData.isAlive()) {
      return;
    }

    switch (game.getState()) {
      case CHANCELLOR_NOMINATION:
        // Check if the CPU is the president
        if (game.getCurrentPresident() == myName) {
          // Yes, so nominate a chancellor
          // Handle checks for whether the player is eligible

        }

        break;
      case CHANCELLOR_VOTING:
        break;
      case LEGISLATIVE_PRESIDENT:
        // If I am the president, vote according to my party preference
        break;
      case LEGISLATIVE_CHANCELLOR:
        // If I am the chancellor, vote according to my party preference
        break;
      case LEGISLATIVE_PRESIDENT_VETO:
        //
        break;
      case PRESIDENTIAL_POWER_PEEK:
      case PRESIDENTIAL_POWER_INVESTIGATE:
      case PRESIDENTIAL_POWER_EXECUTION:
      case PRESIDENTIAL_POWER_ELECTION:
      case POST_LEGISLATIVE:
        // Update our suspicion rating for the other players
        break;
      default:
        break;
    }

    /*
     * CHANCELLOR_NOMINATION
     */
  }
}
