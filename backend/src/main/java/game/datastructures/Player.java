package game.datastructures;

import java.io.Serializable;

/**
 * Holds the data for an individual player.
 * A player has a username and identity associated with them.
 */
public class Player implements Serializable {

    final private String username;
    private Identity id;
    private boolean isAlive;
    private boolean investigated;

    /**
     * Constructs a new Player with the given username.
     * @param username The username of the player.
     * @modifies this
     * @effects this is a new Player that is alive, has an unassigned Identity,
     *          and has not been investigated.
     */
    public Player(String username) {
        this.username = username;
        id = Identity.UNASSIGNED;
        isAlive = true;
        investigated = false;
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

    public Identity getIdentity() {
      return id;
    }

    public boolean isHitler() {
        return this.id.equals(Identity.HITLER);
    }

    public void kill() {
        isAlive = false;
    }

    public boolean isAlive() { return this.isAlive; }

    public void investigate() { investigated = true; }

    public boolean hasBeenInvestigated() { return this.investigated; }

    /**
     * @return true if the player is fascist or hitler.
     */
    public boolean isFascist() {
        return this.id.equals(Identity.HITLER) || this.id.equals(Identity.FASCIST);
    }
}
