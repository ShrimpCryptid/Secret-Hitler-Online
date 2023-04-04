package game.datastructures.board;

import game.datastructures.Policy;

public class NineToTenPlayerBoard extends Board{

    @Override
    public PresidentialPower getActivatedPower() {
        if (getLastEnactedType() == Policy.Type.FASCIST) {
            switch (getNumFascistPolicies()) {
                case 1:
                case 2:
                    return PresidentialPower.INVESTIGATE;
                case 3:
                    return PresidentialPower.ELECTION;
                case 4:
                case 5:
                    return PresidentialPower.EXECUTION;
            }
        }
        return PresidentialPower.NONE;
    }
}
