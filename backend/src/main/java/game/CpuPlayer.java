/**
 * Copyright 2023, Peyton Lee (@ShrimpCryptid)
 */

package game;

import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import game.datastructures.Identity;
import game.datastructures.Player;
import game.datastructures.Policy;

public class CpuPlayer implements Serializable, Comparable<CpuPlayer> {

  private static int MAX_REPUTATION = 5;

  private List<Policy.Type> chancellorChoices;
  private transient Random random;
  private int lastUpdatedRound = 1;

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

  private void updateReputation(String name, int repModifier) {
    int newRep = playerReputation.get(name) + repModifier;
    newRep = Math.max(newRep, -MAX_REPUTATION);
    newRep = Math.min(newRep, MAX_REPUTATION);
    playerReputation.put(name, newRep);
  }

  /**
   * Allows the CpuPlayer to update assumptions after legislation is passed.
   * 
   * @param game
   */
  public void update(SecretHitlerGame game) {
    if (game.getRound() > lastUpdatedRound && game.getState() == GameState.POST_LEGISLATIVE) {
      Policy.Type lastPolicy = game.getLastEnactedPolicy();

      if (lastPolicy == null || game.didElectionTrackerAdvance()) {
        return;
      }

      String lastPresident = game.getCurrentPresident();
      String lastChancellor = game.getCurrentChancellor();

      if (myName.equals(lastPresident)) {
        if (chancellorChoices.get(0) != chancellorChoices.get(1)) {
          // We tested the chancellor. Did they pass?
          if (game.getLastEnactedPolicy() == Policy.Type.FASCIST) {
            updateReputation(lastChancellor, -3);
          } else {
            updateReputation(lastChancellor, 3);
          }
        }
      } else if (myName.equals(lastChancellor)) {
      } else {
        // Update reputation for the chancellor and president based on what policy
        // was passed.
        int repModifier = lastPolicy == Policy.Type.LIBERAL ? 1 : -1;
        if (lastPresident == null || lastChancellor == null) {
          return;
        }
        updateReputation(lastPresident, repModifier);
        updateReputation(lastChancellor, repModifier);
      }

      lastUpdatedRound = game.getRound();
    }
  }

  /**
   * Allows CpuPlayers to take an action, potentially updating the game state.
   * 
   * @return Returns true if the CPU took an action that updated the game state.
   */
  public boolean act(SecretHitlerGame game) {
    // Do nothing if this CpuPlayer is dead (no actions required).
    if (!myPlayerData.isAlive()) {
      return false;
    }

    switch (game.getState()) {
      case CHANCELLOR_NOMINATION:
        return handleChancellorNomination(game);
      case CHANCELLOR_VOTING:
        return handleChancellorVoting(game);
      case LEGISLATIVE_PRESIDENT:
        return handleLegislativePresident(game);
      case LEGISLATIVE_CHANCELLOR:
        return handleLegislativeChancellor(game);
      case LEGISLATIVE_PRESIDENT_VETO:
        return handlePresidentVeto(game);
      case PRESIDENTIAL_POWER_PEEK:
        return handlePresidentialPowerPeek(game);
      case PRESIDENTIAL_POWER_INVESTIGATE:
        return handlePresidentialPowerInvestigate(game);
      case PRESIDENTIAL_POWER_EXECUTION:
        return handlePresidentialPowerExecution(game);
      case PRESIDENTIAL_POWER_ELECTION:
        return handlePresidentialPowerElection(game);
      case POST_LEGISLATIVE:
        // Update our suspicion rating for the other players
        // president should end term
        return handlePostLegislative(game);
      default:
    }
    return false;
  } // end onUpdate

  private boolean isFascistInDanger(SecretHitlerGame game) {
    return game.getNumLiberalPolicies() >= 4;
  }

  private boolean isLiberalInDanger(SecretHitlerGame game) {
    return game.getNumFascistPolicies() >= 5;
  }

  private boolean canHitlerWinByElection(SecretHitlerGame game) {
    return game.getNumFascistPolicies() >= 3;
  }

  private List<Player> removePlayerFromList(String username, List<Player> playerList) {
    if (username == null) {
      return playerList;
    }

    List<Player> ret = new ArrayList<Player>(playerList);
    Iterator<Player> itr = ret.iterator();
    while (itr.hasNext()) {
      if (itr.next().getUsername().equals(username)) {
        itr.remove();
      }
    }
    return ret;
  }

  private List<Player> removeDeadPlayersAndSelf(List<Player> playerList) {
    List<Player> ret = new ArrayList<Player>(playerList);
    Iterator<Player> itr = ret.iterator();
    while (itr.hasNext()) {
      Player curr = itr.next();
      if (curr.getUsername().equals(myName) || !curr.isAlive()) {
        itr.remove();
      }
    }
    return ret;
  }

  private boolean handleChancellorNomination(SecretHitlerGame game) {
    // No action required if we are not president
    if (!game.getCurrentPresident().equals(myName)) {
      return false;
    }

    List<Player> playerList = game.getPlayerList();

    // Remove the chancellor and optionally the president
    playerList = removePlayerFromList(game.getLastChancellor(), playerList);
    if (game.getLivingPlayerCount() > 5) {
      playerList = removePlayerFromList(game.getLastPresident(), playerList);
    }
    playerList = removeDeadPlayersAndSelf(playerList);

    // Nominate a chancellor using a weighted random, based on our role and the
    // current game state. Keep trying until game state has advanced past
    // nomination.
    String chancellorName = null;

    // Choose chancellor nominee using weighted random
    if (myPlayerData.getIdentity() == Identity.FASCIST) {
      if (canHitlerWinByElection(game)) { // Increase likelihood of choosing hitler
        chancellorName = chooseRandomPlayerWeighted(playerList, 0.35f, 1.5f, 0.15f, 0.05f);
      } else {
        chancellorName = chooseRandomPlayerWeighted(playerList, 1f, 0.25f, 0.5f, 0.25f);
      }
    } else if (myPlayerData.getIdentity() == Identity.HITLER) {
      // Target liberal players to increase trust
      chancellorName = chooseRandomPlayerWeighted(playerList, 0.5f, 0, 1, 0.25f);
    } else { // Liberal
      if (canHitlerWinByElection(game)) { // Avoid hitler or fascist players.
        // TODO: Add a way to check for "safe" players
        // TODO: Add filters for certain players (ie, players ineligible for reelection)
        chancellorName = chooseRandomPlayerWeighted(playerList, 0.01f, 0, 1, 0.05f);
      } else { // Less drastic avoidance of F/H players
        chancellorName = chooseRandomPlayerWeighted(playerList, 0.01f, 0, 1, 0.1f);
      }
    }

    game.nominateChancellor(chancellorName);
    return true;

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

  private boolean handleChancellorVoting(SecretHitlerGame game) {
    // Check that we haven't already voted
    if (game.hasPlayerVoted(myName)) {
      return false;
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
      return true;
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
      return true;
    }

    // DEFAULT voting behavior for liberals + hitler:
    // Use an individual AND combined trust threshold, which get higher when
    // fascists can win by electing hitler.
    int minIndividualRep = -3; // Avoid players with bad rep.
    int minCombinedRep = -2; // Avoid players if they have a bad combined rep.

    if (canHitlerWinByElection(game)) { // Tighten thresholds
      minIndividualRep = -2;
      minCombinedRep = -1;
    }

    if (presidentRep < minIndividualRep || chancellorRep < minIndividualRep || combinedRep < minCombinedRep) {
      // This legislation is untrustworthy and should probably not be voted for.
      voteWithProbability(game, 0.05f);
    } else {
      // Scale probability of voting yes with the reputation of the players.
      // Use a parabolic curve that's more likely to say yes to neutral or
      // unknown values: f(t) = 2t - t^2
      // f(0) = 0, f(0.5) = 0.75, f(1) = 1
      float voteProbability = 2f * t - (t * t);
      voteWithProbability(game, voteProbability);
    }
    return true;
  }

  /**
   * Gets the index of the first policy of a matching type, if it exists.
   * Returns -1 otherwise.
   */
  private int tryGetIndexOfPolicy(List<Policy> policies, Policy.Type type) {
    for (int i = 0; i < policies.size(); i++) {
      Policy policy = policies.get(i);
      if (policy.getType() == type) {
        return i;
      }
    }
    return -1;
  }

  private boolean handleLegislativePresident(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false; // We are not president, no action required
    }

    List<Policy> policies = game.getPresidentLegislativeChoices();

    // Count the number of fascist and liberal policies
    int fascistPolicyCount = 0;
    for (Policy policy : policies) {
      if (policy.getType() == Policy.Type.FASCIST) {
        fascistPolicyCount++;
      }
    }
    int liberalPolicyCount = SecretHitlerGame.PRESIDENT_DRAW_SIZE - fascistPolicyCount;

    // Choose a policy to discard
    int policyIndexToRemove = 0;

    // Check if the policy deck is all of one card type. If so, choose any to
    // discard, since there is essentially no choice to make.
    Identity myId = myPlayerData.getIdentity();
    if (fascistPolicyCount == SecretHitlerGame.PRESIDENT_DRAW_SIZE
        || liberalPolicyCount == SecretHitlerGame.PRESIDENT_DRAW_SIZE) {
      policyIndexToRemove = 0;

    } else if (fascistPolicyCount == 1) { // One fascist, two liberal policies
      if (myId == Identity.FASCIST) {
        // Discard one of the liberal policies
        policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL);
      } else if (myId == Identity.HITLER) {
        if (isFascistInDanger(game)) {
          // Don't let liberals win by policy election
          policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL);
        } else {
          // Choose random policy
          policyIndexToRemove = random.nextInt(SecretHitlerGame.PRESIDENT_DRAW_SIZE);
        }

      } else { // Liberal
        if (isLiberalInDanger(game)) {
          // Don't give choices if in danger.
          policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.FASCIST);
        } else {
          // Choose a random policy to discard
          policyIndexToRemove = random.nextInt(SecretHitlerGame.PRESIDENT_DRAW_SIZE);
        }
      }

    } else if (fascistPolicyCount == 2) { // Two fascist, one liberal policy
      if (myId == Identity.FASCIST) {
        // Discard the liberal policy
        policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL);
      } else if (myId == Identity.HITLER) {
        if (isFascistInDanger(game)) {
          // Don't let liberals win by policy election
          policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL);
        } else {
          // Choose a random policy to discard
          policyIndexToRemove = random.nextInt(SecretHitlerGame.PRESIDENT_DRAW_SIZE);
        }
      } else {
        // Liberals should always discard the fascist policy
        policyIndexToRemove = tryGetIndexOfPolicy(policies, Policy.Type.FASCIST);
      }
    }

    // Track what choices we gave the chancellor.
    chancellorChoices = new ArrayList<>();
    for (Policy policy : policies) {
      chancellorChoices.add(policy.getType());
    }
    chancellorChoices.remove(policyIndexToRemove);

    game.presidentDiscardPolicy(policyIndexToRemove);
    return true;
  }

  private boolean handleLegislativeChancellor(SecretHitlerGame game) {
    if (!myName.equals(game.getCurrentChancellor())) {
      return false;
    }

    Identity myId = myPlayerData.getIdentity();
    List<Policy> policies = game.getChancellorLegislativeChoices();
    // Veto can't re-occur
    boolean canVeto = game.getNumFascistPolicies() == 5 && !game.didVetoOccurThisTurn();

    if (policies.get(0).getType() == policies.get(1).getType()) {
      // Both policies are the same.
      Policy.Type policyType = policies.get(0).getType();
      if (canVeto && policyType == Policy.Type.FASCIST && myId == Identity.LIBERAL) {
        // We are liberal and there are two fascist policies, so we should veto.
        game.chancellorVeto();
        return true;
      } else if (canVeto && policyType == Policy.Type.LIBERAL && myPlayerData.isFascist()) {
        // Check if our president is a known fascist/hitler. If so, we can pull
        // off a veto with them.
        String president = game.getCurrentPresident();
        if (knownPlayerRoles.containsKey(president)) {
          Identity presidentId = knownPlayerRoles.get(president);
          if (presidentId == Identity.HITLER || presidentId == Identity.FASCIST) {
            game.chancellorVeto();
            return true;
          }
        }
      }
      // Otherwise, enact one of them because the order doesn't matter
      game.chancellorEnactPolicy(0);
    } else {
      // One Liberal and one fascist policy, so decide based on role
      if (myId == Identity.FASCIST) {
        // Fascists should always try and pass more fascist policies
        game.chancellorEnactPolicy(tryGetIndexOfPolicy(policies, Policy.Type.FASCIST));
      } else if (myId == Identity.HITLER) {
        if (isFascistInDanger(game)) {
          // Don't pass liberal policies if fascists are in danger of losing from them
          game.chancellorEnactPolicy(tryGetIndexOfPolicy(policies, Policy.Type.FASCIST));
        } else {
          // preferentially choose liberal policies to gain trust
          game.chancellorEnactPolicy(tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL));
        }
      } else { // Liberal
        game.chancellorEnactPolicy(tryGetIndexOfPolicy(policies, Policy.Type.LIBERAL));
      }
    }
    return true;
  }

  private boolean handlePresidentVeto(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false; // We are not president, no action required
    }

    Identity myId = myPlayerData.getIdentity();
    List<Policy> policies = game.getChancellorLegislativeChoices();

    // Check if policies are the same
    if (policies.get(0).getType() == policies.get(1).getType()) {
      Policy.Type policyType = policies.get(0).getType();
      if (myId == Identity.LIBERAL) {
        boolean shouldAllowVeto = policyType == Policy.Type.FASCIST;
        // Allow veto for fascist policies, deny for liberal policies
        game.presidentialVeto(shouldAllowVeto);
        updateReputation(game.getCurrentChancellor(), shouldAllowVeto ? 4 : -4);
      } else { // Fascists and hitler should do the inverse
        game.presidentialVeto(policyType == Policy.Type.LIBERAL);
      }
    } else { // 1 F, 1 L
      // No reason to veto since chancellor has a choice
      game.presidentialVeto(false);
      updateReputation(game.getCurrentChancellor(), -1);
    }
    return true;
  }

  private boolean handlePresidentialPowerPeek(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false;
    }
    // Currently does nothing for peek results
    game.getPeek();
    game.endPeek();
    return true;
  }

  private boolean handlePresidentialPowerInvestigate(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false;
    }
    List<Player> playerList = removeDeadPlayersAndSelf(game.getPlayerList());
    String selectedPlayer = null;
    while (selectedPlayer == null || game.getPlayer(selectedPlayer).hasBeenInvestigated()) {
      if (myPlayerData.getIdentity() == Identity.LIBERAL) {
        selectedPlayer = chooseRandomPlayerWeighted(playerList, 1f, 0, -0.4f, 0.5f);
      } else {
        // Totally randomize selection
        selectedPlayer = chooseRandomPlayerWeighted(playerList, 1f, 1f, 1f, 0.5f);
      }
    }
    // Update known roles using the investigated role
    knownPlayerRoles.put(selectedPlayer, game.investigatePlayer(selectedPlayer));
    return true;
  }

  private boolean handlePresidentialPowerElection(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false;
    }
    String selectedPlayer = "";
    // Liberals should avoid suspicious players, while fascists should
    // slightly avoid liberals. For both, preferentially choose players.
    List<Player> playerList = removeDeadPlayersAndSelf(game.getPlayerList());
    if (myPlayerData.getIdentity() == Identity.LIBERAL) {
      selectedPlayer = chooseRandomPlayerWeighted(playerList, -0.8f, 0, 1f, 0.5f);
    } else {
      selectedPlayer = chooseRandomPlayerWeighted(playerList, 1f, 1f, 0.5f, 0.5f);
    }
    game.electNextPresident(selectedPlayer);
    return true;
  }

  private boolean handlePresidentialPowerExecution(SecretHitlerGame game) {
    if (!game.getCurrentPresident().equals(myName)) {
      return false;
    }

    String selectedPlayer = null;
    List<Player> playerList = removeDeadPlayersAndSelf(game.getPlayerList());
    // Keep going until a valid player is selected
    while (selectedPlayer == null || !game.getPlayer(selectedPlayer).isAlive()) {
      if (myPlayerData.getIdentity() == Identity.LIBERAL) {
        // Aim for fascist or suspicious players
        // TODO: Keep a pool of players that are tested/untested for hitler role?
        selectedPlayer = chooseRandomPlayerWeighted(playerList, 1f, 1f, -0.4f, 0);
      } else {
        selectedPlayer = chooseRandomPlayerWeighted(playerList, 0.5f, 0, 1f, 0);
        // Do not assassinate hitler
        if (knownPlayerRoles.get(selectedPlayer) == Identity.HITLER) {
          selectedPlayer = null;
        }
      }
    }
    game.executePlayer(selectedPlayer);
    return true;
  }

  private boolean handlePostLegislative(SecretHitlerGame game) {
    if (game.getCurrentPresident().equals(myName)) {
      game.endPresidentialTerm();
      return true;
    }
    return false;
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
   * Ignores dead players and self (this CPU).
   * 
   * @param playerList    : List of players to traverse.
   * @param fascistWeight : Relative weight assigned to known or suspected
   *                      fascist players. Higher values mean the player is
   *                      more likely to be chosen.
   * @param hitlerWeight  : Used only if Hitler identity is known. (relevant
   *                      only for fascist players.)
   * @param liberalWeight : Relative weight assigned to known or suspected
   *                      liberal players.
   * @param userBias      : How much selection should be biased towards non-CPU
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

      if (!myName.equals(currPlayerName) && currPlayer.isAlive()) {
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

      // If weight is 0, set threshold to a negative number.
      if (currWeight < 0.000001f) {
        currWeight = 0f;
        playerMinThreshold[i] = -1f;
      } else {
        totalWeight += currWeight;
        playerMinThreshold[i] = totalWeight;
      }

    } // end for

    // Calculate a random value based on the total weight, then traverse the
    // thresholds until we find and return the matching player.
    int index = getWeightedRandomIndex(playerMinThreshold);
    return playerList.get(index).getUsername();
  } // end chooseRandomPlayerWeighted()

  private int getWeightedRandomIndex(float[] weights) {
    // Calculate total weight
    float totalWeight = 0;
    for (int i = 0; i < weights.length; i++) {
      if (weights[i] > 0) {
        totalWeight += 1;
      }
    }

    float t = (float) (totalWeight * random.nextDouble());
    int lastValidIndex = 0;

    for (int i = 0; i < weights.length; i++) {
      if (weights[i] > 0f) {
        lastValidIndex = i;
        if (t >= totalWeight - weights[i]) {
          return i;
        }
      }
    }
    return lastValidIndex;
  }

  @Override
  public int compareTo(CpuPlayer o) {
    return this.myName.compareTo(((CpuPlayer) o).myName);
  }

  private void readObject(java.io.ObjectInputStream in) throws IOException, ClassNotFoundException {
    in.defaultReadObject();
    random = new Random();
  }

} // end CpuPlayer
