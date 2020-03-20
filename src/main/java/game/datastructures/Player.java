package game.datastructures;

import org.json.JSONObject;

/**
 * Holds the data for an individual player.
 * A player has a username and identity associated with them.
 */
public class Player {

    private String username;
    private Identity id;
    private boolean isAlive;

    /**
     * Constructs a new Player with the given username.
     * @param username
     */
    public Player(String username) {
        this.username = username;
        id = Identity.UNASSIGNED;
        isAlive = true;
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

    public void kill() {
        isAlive = false;
    }

    public boolean isAlive() { return this.isAlive; }

    /**
     * @return true if the player is fascist or hitler.
     */
    public boolean isFascist() {
        return this.id.equals(Identity.HITLER) || this.id.equals(Identity.FASCIST);
    }

    public JSONObject toJSONObject() {
        JSONObject out = new JSONObject();
        out.put("username", this.username);
        out.put("is_alive", isAlive());
        return out;
    }
}
