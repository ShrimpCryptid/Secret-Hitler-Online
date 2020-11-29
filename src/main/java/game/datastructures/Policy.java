package game.datastructures;

import java.io.Serializable;

/**
 * An immutable object that represents either a Fascist or Liberal Policy.
 */
public class Policy implements Serializable {
    public enum Type {
        FASCIST,
        LIBERAL
    }
    private final Type type;

    public Policy(Type type) {
        this.type = type;
    }

    public Type getType() {
        return this.type;
    }
}
