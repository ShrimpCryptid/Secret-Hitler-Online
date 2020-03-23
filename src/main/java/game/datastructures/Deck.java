package game.datastructures;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A deck holds an ordered list of Policies and can be shuffled, added to, or removed from.
 * The Deck can be represented by a list of policies, where index i = 0 is the top of the deck.
 */
public class Deck {

    // The front of the list is the "top" of the deck.
    private List<Policy> deck;

    /**
     * Constructs a new empty deck.
     * @modifies this
     * @effects this is a new deck with no Policies.
     */
    public Deck() {
        deck = new ArrayList<>();
    }

    /**
     * Removes the Policy from the top of the deck.
     * @throws IndexOutOfBoundsException if the deck is empty.
     * @modifies this
     * @effects removes the Policy from the top of the deck.
     * @return the Policy that was at the top of the deck.
     */
    public Policy remove() {
        if (isEmpty()) {
            throw new IndexOutOfBoundsException("Cannot remove a card from an empty deck.");
        }
        return deck.remove(0);
    }

    /**
     * Adds the given Policy to the top of the deck.
     * @param newPolicy the Policy to add to the deck.
     * @modifies this
     * @effects adds the given Policy to the deck at index 0.
     */
    public void add(Policy newPolicy) {
        deck.add(0, newPolicy);
    }

    /**
     * Peeks at a Policy in the deck.
     * @param index the index of the Policy in the deck, where {@code index} = 0 is the top of the deck.
     * @throws IndexOutOfBoundsException if {@code index} {@literal <} 0 or {@code index} {@literal >=} this.getSize()
     * @return the Policy at the given index.
     */
    public Policy peek(int index) {
        return deck.get(index);
    }

    public boolean isEmpty() {
        return getSize() == 0;
    }

    /**
     * Gets the number of Policy cards
     * @return the size of the deck.
     */
    public int getSize() {
        return deck.size();
    }

    /**
     * Shuffles the deck.
     * @effects Randomizes the ordering of the policy cards in this Deck.
     */
    public void shuffle() {
        Collections.shuffle(deck);
    }
}
