package datastructures.board;

import datastructures.Policy;

/**
 * A Board meant for 5-6 players.
 */
public class FiveToSixPlayerBoard extends Board {


    @Override
    public PresidentialPower getActivatedPower() {
        if (getLastEnactedType() == Policy.Type.FASCIST) {
            switch (getNumFascistPolicies()) {
                case 3:
                    return PresidentialPower.PEEK;
                case 4:
                case 5:
                    return PresidentialPower.EXECUTION;
            }
        }
        return PresidentialPower.NONE;
    }

}
