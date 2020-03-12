package datastructures;

/**
 * Holds the data for an individual player.
 * A player has a username and identity associated with them.
 */
public class Player {

    private String username;
    private Identity id;
    public enum Identity {
        UNASSIGNED,
        HITLER,
        FASCIST,
        LIBERAL
    }

    /**
     * Constructs a new Player with the given username.
     * @param username
     */
    public Player(String username) {
        this.username = username;
        id = Identity.UNASSIGNED;
    }

    public String getUsername() {
        return this.username;
    }

    /**
     * Sets the player's identity.
     * @param id the Identity of the player.
     * @throws IllegalArgumentException if {@code id} is null
     * @modifies this
     * @effects sets the player's identity to {@code id}.
     */
    public void setIdentity(Identity id) {
        this.id = id;
    }

    public boolean isHitler() {
        return this.id.equals(Identity.HITLER);
    }

    /**
     * @return true if the player is fascist or hitler.
     */
    public boolean isFascist() {
        return this.id.equals(Identity.HITLER) || this.id.equals(Identity.FASCIST);
    }
}
