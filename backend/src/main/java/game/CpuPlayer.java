package game;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import game.datastructures.Identity;
import game.datastructures.Player;

public class CpuPlayer implements Serializable {

  private static int MAX_SUSPICION = 5;

  /**
   * Tracks the current level of suspicion in a range from [-5, 5] that the
   * CpuPlayer has for each other player (both other CPUs and players) in the
   * game, starting at neutral (0). The higher the suspicion value is, the more
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

  public void initialize(SecretHitlerGame game, Collection<String> players) {
    // Set player suspicion to neutral (5) by default
    playerSuspicion.clear();
    for (String player : players) {
      if (!player.equals(myName)) { // Don't add an entry for self
        playerSuspicion.put(player, 0);
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
  } // end initialize()

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
  } // end onUpdate


  /**
   * Returns the name of a player, chosen by weighted random. Weighting is
   * determined by suspected or known roles, and can be biased towards or away
   * from players.
   * 
   * @param playerList    : List of players to traverse.
   * @param fascistWeight :
   * @param liberalWeight :
   * @param hitlerWeight  : Used only if Hitler identity is known.
   * @param playerBias    : How much selection should be biased towards players,
   *                      relative. Positive values increase likelihood that
   *                      players are chosen.
   * @return The name of a player, chosen by weighted random.
   */
  public String chooseRandomPlayerWeighted(List<Player> playerList,
      float fascistWeight, float liberalWeight, float hitlerWeight,
      float playerBias) {

    // Make a copy of the player list so we can modify, then remove this
    // CpuPlayer from it for traversal
    playerList = new ArrayList<Player>(playerList);

    // Traverse player list, calculating weight for each player based on known
    // or suspected roles
    float totalWeight = 0f;
    float[] playerMinThreshold = new float[playerList.size()];

    for (int i = 0; i < playerList.size(); i++) {
      Player currPlayer = playerList.get(i);
      String currPlayerName = currPlayer.getUsername();
      float currWeight = 0f;

      if (!myName.equals(currPlayerName)) { // Skip self
        if (knownPlayerRoles.containsKey(currPlayerName)) { // Role is known
          switch (knownPlayerRoles.get(currPlayerName)) {
            case FASCIST:
              currWeight = fascistWeight;
              break;
            case HITLER:
              currWeight = hitlerWeight;
              break;
            default: // liberal
              currWeight = liberalWeight;
          }
        } else { // Role unknown
          // Normalize suspicion value to [0, 1] range, where 0 is fascist.
          int suspicion = playerSuspicion.get(currPlayerName);
          float t = (suspicion + MAX_SUSPICION) / (2f * MAX_SUSPICION);
          // Interpolate between fascist and liberal weights.
          currWeight = t * liberalWeight + (1f - t) * fascistWeight;
        }

        // Add player biases
        if (!currPlayer.isCpu()) {
          currWeight += playerBias;
        }
      } // end if

      // Clamp weight so there are no negative values.
      currWeight = Math.max(currWeight, 0f);

      // If weight is 0, set threshold to an unreachable float number so the
      // player won't ever be chosen.
      if (currWeight < 0.0000001f) {
        playerMinThreshold[i] = Float.MAX_VALUE;
      } else {
        playerMinThreshold[i] = totalWeight;
      }
      totalWeight += currWeight;

    } // end for

    // Calculate a random value based on the total weight, then traverse the
    // thresholds until we find and return the matching player.
    float random = (float) (totalWeight * Math.random());
    for (int i = 0; i < playerList.size(); i++) {
      if (random >= playerMinThreshold[i]) {
        // We've met the threshold, so choose this player!
        return playerList.get(i).getUsername();
      }
    }
    assert (false); // Should be unreachable.
    return "";
  }

} // end CpuPlayer
