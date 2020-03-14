package datastructures.board;

import datastructures.Policy;

public abstract class Board {

    int FASCIST_POLICIES_TO_WIN = 6;
    int LIBERAL_POLICIES_TO_WIN = 5;

    // The minimum number of fascist policies required before
    // fascists can win by electing Hitler chancellor
    int MIN_POLICIES_FOR_CHANCELLOR_VICTORY = 3;

    private int numFascistPolicies;
    private int numLiberalPolicies;

    private Policy lastEnacted;


    /** Constructs a new board.
     * @modifies this
     * @effects this is a new, empty board.
     */
    public Board() {
        numFascistPolicies = 0;
        numLiberalPolicies = 0;
    }

    /**
     * Enacts the given policy.
     * @param policy the Policy to enact.
     * @throws IllegalStateException if the liberals or fascists have already won.
     *                               (isLiberalVictory() or isFascistVictory() is true)
     * @modifies this
     * @effects adds {@code policy} to the count of liberal and fascist policies.
     */
    public void enactPolicy(Policy policy) {
        if (isLiberalVictory() || isFascistVictory()) {
            throw new IllegalStateException("Cannot enact a policy when victory conditions were already reached.");
        }
        if (policy.getType() == Policy.Type.FASCIST) {
            numFascistPolicies++;
        } else {
            numLiberalPolicies++;
        }
        lastEnacted = policy;
    }


    /**
     * Gets the type of the last enacted policy.
     * @throws NullPointerException if no policy has been enacted yet.
     * @return the Policy.Type of the last policy enacted.
     */
    public Policy.Type getLastEnactedType() {
        if (lastEnacted == null) {
            throw new NullPointerException("No policy has been enacted yet");
        }
        return lastEnacted.getType();
    }


    /**
     * Gets the count of fascist policies.
     * @return the number of fascist policies enacted.
     */
    public int getNumFascistPolicies() {
        return numFascistPolicies;
    }


    /**
     * Gets the count of liberal policies.
     * @return the number of liberal policies enacted.
     */
    public int getNumLiberalPolicies() {
        return numLiberalPolicies;
    }


    /**
     * Determines whether the liberal party won by policy count.
     * @return true if the number of Liberal Policies >= {@code LIBERAL_POLICIES_TO_WIN}
     */
    public boolean isLiberalVictory() {
        return getNumLiberalPolicies() >= LIBERAL_POLICIES_TO_WIN;
    }


    /**
     * Determines whether the fascist party won by policy count.
     * @return true if the number of Fascist Policies >= {@code FASCIST_POLICIES_TO_WIN}
     */
    public boolean isFascistVictory() {
        return getNumFascistPolicies() >= FASCIST_POLICIES_TO_WIN;
    }


    /**
     * Gets whether the last policy activated a power.
     * @requires a policy has already been enacted.
     * @return true if the last enacted policy activated a presidential power.
     */
    public boolean hasActivatedPower() {
        return getActivatedPower() != PresidentialPower.NONE;
    }

    /**
     * Gets the presidential power (if any) that was activated by the last policy.
     * @requires a policy has already been enacted.
     * @return If no presidential power was unlocked from the last policy enacted, returns NONE. Otherwise, returns the
     *         last activated presidential power.
     */
    public PresidentialPower getActivatedPower() {
        return PresidentialPower.NONE;
    }

    public boolean fascistsCanWinByElection() {
        return (getNumFascistPolicies() >= MIN_POLICIES_FOR_CHANCELLOR_VICTORY);
    }

}
