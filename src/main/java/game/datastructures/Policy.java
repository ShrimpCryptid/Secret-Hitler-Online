package game.datastructures;

/**
 * An immutable object that represents either a Fascist or Liberal Policy.
 */
public class Policy {
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
