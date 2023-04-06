package game;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import game.datastructures.Identity;
import game.datastructures.Player;

// TODO: Move CpuPlayer thresholds to an input file?

public class CpuPlayer implements Serializable {

  private static int MAX_REPUTATION = 5;

  private Random random;

  /**
   * Tracks the current level of reputation in a range from [-5, 5] 
   * for each other player (both other CPUs and players) in the game, starting
   * at neutral (0). The lower the reputation value is, the more
   * likely the CpuPlayer will act as though the player is Fascist/Hitler.
   * 
   * Note that this tracks the general reputation a player has, regardless of
   * whether their role is known by this CpuPlayer.
   */
  public final HashMap<String, Integer> playerReputation;

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
    playerReputation = new HashMap<>();
    knownPlayerRoles = new HashMap<>();
    random = new Random();
  }

  public void initialize(SecretHitlerGame game) {
    List<Player> playerList = game.getPlayerList();

    // Set player suspicion to neutral (5) by default
    playerReputation.clear();
    for (Player player : playerList) {
      playerReputation.put(player.getUsername(), 0);
    }

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

    // Mark ourselves as a CPU Player in the game
    myPlayerData.markAsCpu();

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

    // Add our own identity to the list of known roles
    knownPlayerRoles.put(myName, myPlayerData.getIdentity());  

  } // end initialize()

  public void onUpdate(SecretHitlerGame game) {
    // Do nothing if this CpuPlayer is dead (no actions required).
    if (!myPlayerData.isAlive()) {
      return;
    }

    switch (game.getState()) {
      case CHANCELLOR_NOMINATION:
        handleChancellorNomination(game);
        break;
      case CHANCELLOR_VOTING:
        handleChancellorVoting(game);
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

  private boolean isFascistInDanger(SecretHitlerGame game) {
    return game.getNumLiberalPolicies() >= 4;
  }

  private boolean canHitlerWinByElection(SecretHitlerGame game) {
    return game.getNumFascistPolicies() >= 3;
  }

  private boolean isValidChancellor(String name, SecretHitlerGame game) {
    return !(name == null
        || name.equals(game.getLastChancellor())
        || (name.equals(game.getLastPresident()) && game.getLivingPlayerCount() > 5));
  }

  private void handleChancellorNomination(SecretHitlerGame game) {
    // No action required if we are not president
    if (!game.getCurrentPresident().equals(myName)) {
      return;
    }

    List<Player> playerList = game.getPlayerList();

    // Nominate a chancellor using a weighted random, based on our role and the
    // current game state. Keep trying until game state has advanced past nomination.
    while (game.getState() == GameState.CHANCELLOR_NOMINATION) {
      String chancellorName = null;

      // Choose chancellor nominee using weighted random
      if (myPlayerData.getIdentity() == Identity.FASCIST) {
        if (canHitlerWinByElection(game)) {  // Increase likelihood of choosing hitler
          chancellorName = chooseRandomPlayerWeighted(playerList, 0.25f, 1f, 0.25f, 0.05f);
        } else {
          chancellorName = chooseRandomPlayerWeighted(playerList, 1f, 0.25f, 0.5f, 0.25f);
        }
      } else if (myPlayerData.getIdentity() == Identity.HITLER) {
        // Target liberal players to increase trust
        chancellorName = chooseRandomPlayerWeighted(playerList, 0.5f, 0, 1, 0.25f);
      } else { // Liberal
        if (canHitlerWinByElection(game)) { // Avoid hitler or fascist players.
          // TODO: Add a way to check for "safe" players
          chancellorName = chooseRandomPlayerWeighted(playerList, -0.2f, -0.2f, 1, 0.05f);
        } else { // Less drastic avoidance of F/H players
          chancellorName = chooseRandomPlayerWeighted(playerList, 0, 0, 1, 0.1f);
        }
      }

      if (isValidChancellor(chancellorName, game)) {
        game.nominateChancellor(chancellorName);
      }
    }

    // Handle checks for whether the player is eligible
  }


  private void voteWithProbability(SecretHitlerGame game, float yesProbability) {
    double t = random.nextDouble();
    boolean vote = t <= yesProbability;
    game.registerVote(myName, vote);
  }

  /**
   * Gets the player reputation, setting to min/max value if identity is known.
   */
  private int getPlayerReputationWithIdentity(String playerName) {
    int reputation = playerReputation.get(playerName);
    if (knownPlayerRoles.containsKey(playerName)) {
      Identity id = knownPlayerRoles.get(playerName);
      if (id == Identity.FASCIST || id == Identity.HITLER) {
        reputation = -1 * MAX_REPUTATION;
      } else {
        reputation = MAX_REPUTATION;
      }
    }
    return reputation;
  }


  private void handleChancellorVoting(SecretHitlerGame game) {
    // Check that we haven't already voted
    if (game.hasPlayerVoted(myName)) {
      return;
    }

    Identity myId = myPlayerData.getIdentity();
    String chancellor = game.getCurrentChancellor();
    String president = game.getCurrentPresident();
    // Determine reputation level for the nominated players.
    int presidentRep = getPlayerReputationWithIdentity(president);
    int chancellorRep = getPlayerReputationWithIdentity(chancellor);

    // Modify reputation if we're hitler and part of the legislation.
    // (basically, treat ourselves as though we're liberal.)
    if (myId == Identity.HITLER) {
      if (myName.equals(president)) {
        presidentRep = MAX_REPUTATION;
      } else if (myName.equals(chancellor)) {
        chancellorRep = MAX_REPUTATION;
      }
    }

    int combinedRep = presidentRep + chancellorRep;

    // Normalize combined reputation to a [0,1] range
    float t = (combinedRep + 2 * MAX_REPUTATION) / (4f * MAX_REPUTATION);
    
    // Fascists should vote for win condition almost always
    if (myPlayerData.isFascist() && canHitlerWinByElection(game)
        && game.getPlayer(chancellor).isHitler()) {
      voteWithProbability(game, 0.99f);
      return;
    }

    // Fascist voting behavior (+hitler if fascists are in danger)
    if (myId == Identity.FASCIST || (myId == Identity.HITLER && isFascistInDanger(game))) {
      // Vote with some randomness because fascists know the roles of every
      // other player.
      // t will either be 0, 0.5, or 1.0, depending on which roles
      // are elected. Weight the scale slightly more towards fascist players.
      float fascistVoteProbability = 0.8f;
      float liberalVoteProbability = 0.6f;

      // Update these values if we're in danger
      if (isFascistInDanger(game)) {
        fascistVoteProbability = 0.9f;
        liberalVoteProbability = 0.25f;
      }
      float voteProbability = t * liberalVoteProbability + (1f - t) * fascistVoteProbability;
      voteWithProbability(game, voteProbability);
      return;
    }
      
    // DEFAULT voting behavior for liberals + hitler:
    // Use an individual AND combined trust threshold, which get higher when
    // fascists can win by electing hitler.
    int minIndividualRep = -3;  // Avoid players with bad rep.
    int minCombinedRep = -3; // Avoid players if they have a bad combined rep.
    
    if (canHitlerWinByElection(game)) {  // Tighten thresholds 
      minIndividualRep = -2;
      minCombinedRep = -2;
    }

    if (presidentRep < minIndividualRep || chancellorRep < minIndividualRep || combinedRep < minCombinedRep) {
      // This legislation is untrustworthy and should probably not be voted for.
      voteWithProbability(game, 0.1f);
    } else { 
      // Scale probability of voting yes with the reputation of the players.
      // Use a parabolic curve that's more likely to say yes to neutral or
      // unknown values: f(t) = 2t - t^2
      // f(0) = 0, f(0.5) = 0.75, f(1) = 1
      float voteProbability = 2f * t - (t * t);
      voteWithProbability(game, voteProbability);
    }
    return;
  }


  /**
   * Returns the name of a player, chosen by weighted random. Weighting is
   * determined by suspected or known roles, and can be biased towards or away
   * from users.
   * 
   * If a player's role is unknown, the weight will be calculated based
   * on the strength of their reputation, interpolated between the fascist and
   * liberal role weights.
   * 
   * @param playerList    : List of players to traverse.
   * @param fascistWeight : Relative weight assigned to known or suspected
   *                      fascist players. Higher values mean the player is 
   *                      more likely to be chosen.
   * @param hitlerWeight  : Used only if Hitler identity is known. (relevant
   *                      only for fascist players.)
   * @param liberalWeight : Relative weight assigned to known or suspected
   *                      liberal players.
   * @param userBias    : How much selection should be biased towards non-CPU
   *                      players, relative. Positive values increase likelihood
   *                      that players are chosen.
   * @return The name of a player, chosen by weighted random.
   */
  public String chooseRandomPlayerWeighted(List<Player> playerList,
      float fascistWeight, float hitlerWeight, float liberalWeight,
      float userBias) {

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
          Identity currId = knownPlayerRoles.get(currPlayerName);
          if (currId == Identity.FASCIST) {
            currWeight = fascistWeight;
          } else if (currId == Identity.HITLER) {
            currWeight = hitlerWeight;
          } else {
            currWeight = liberalWeight;
          }
        } else { // Role unknown
          // Normalize suspicion value to [0, 1] range, where 0 is fascist.
          int reputation = playerReputation.get(currPlayerName);
          float t = (reputation + MAX_REPUTATION) / (2f * MAX_REPUTATION);
          // Interpolate between fascist and liberal weights.
          currWeight = t * liberalWeight + (1f - t) * fascistWeight;
        }

        // Add player biases
        if (!currPlayer.isCpu()) { 
          currWeight += userBias;
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
    float t = (float) (totalWeight * random.nextDouble());
    for (int i = 0; i < playerList.size(); i++) {
      if (t >= playerMinThreshold[i]) {
        // We've met the threshold, so choose this player!
        return playerList.get(i).getUsername();
      }
    }
    return null;
  } // end chooseRandomPlayerWeighted()

} // end CpuPlayer
