import React, {Component} from "react";
import PropTypes from "prop-types";
import DiscardDeck from "../assets/board-discard.png";
import DrawDeck from "../assets/board-draw.png";
import PolicyBack from "../assets/board-policy.png";
import './Deck.css';

const MAX_CARDS = 17;
// These two are the final locations for cards in the hide/show states (or the start for the transitions).
const FINAL_HIDE = "deck-final-hide";
const FINAL_SHOW = "deck-final-show";
const TRANSITION_SHOW = "deck-transition-show";
const TRANSITION_HIDE = "deck-transition-hide";

class Deck extends Component {

    cardStates;
    numCards;

    constructor(props) {
        super(props);
        this.state = {
            playingAnimation: false,
            cardCount: this.props.cardCount,
        };

        this.cardStates = [MAX_CARDS];
        this.numCards = this.props.cardCount;
        for (let i = 0; i < MAX_CARDS; i++) {
            if (i < this.props.cardCount) {
                this.cardStates[i] = FINAL_SHOW;
            } else {
                this.cardStates[i] = FINAL_HIDE;
            }
        }

        this.getCards = this.getCards.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let oldCount = this.state.cardCount;
        let newCount = this.props.cardCount;

        // Check if the number of cards in this deck has changed, and play an animation in response if it has.
        if (oldCount !== newCount && !this.state.playingAnimation) {
            this.setState({playingAnimation: true});
            let delayNext, delayChangeState;
            let totalDelay = 0;
            if (newCount < oldCount) {  // Cards were taken out of the deck
                let difference = oldCount - newCount;
                if (difference <= 3) {
                    delayNext = 350;
                } else {
                    delayNext = 150;
                }
                delayChangeState = 510;
                for (let i = oldCount - 1; i >= newCount; i--) {
                    // Start transition out, then move to final hidden position.
                    setTimeout(() => {this.cardStates[i] = TRANSITION_HIDE; this.numCards = i; this.forceUpdate()}, totalDelay);
                    setTimeout(() => {this.cardStates[i] = FINAL_HIDE; this.forceUpdate()}, totalDelay + delayChangeState);
                    totalDelay += delayNext;
                }
            } else {  // Cards were added to the deck
                delayNext = 150;
                delayChangeState = 300;
                for (let i = oldCount; i < newCount; i++) {
                    // Start transition in, then move to final shown position.
                    setTimeout(() => {this.cardStates[i] = TRANSITION_SHOW; this.forceUpdate()}, totalDelay);
                    setTimeout(() => {this.cardStates[i] = FINAL_SHOW; this.numCards = i + 1; this.forceUpdate()}, totalDelay + delayChangeState);
                    totalDelay += delayNext;
                }
            }
            // After all cards have played their animations, reset the card count and signal the end of the anim.
            setTimeout(() => {this.setState({playingAnimation: false, cardCount: newCount});}, totalDelay);
        }
    }

    getCards() {
        let cards = [MAX_CARDS];
        let topOffset = 9;
        let topDistance = 2;
        for (let i = 0; i < MAX_CARDS; i++) {
            let top = topOffset - (topDistance * i);
            if (this.cardStates[i] === FINAL_HIDE) { // Move the hidden card up so it transition in later.
                top -= 15;
            }

            cards[i] = (
                <img
                    src={PolicyBack}
                    id={"deck-policy"}
                    style={{top: top + "%"}}
                    className={this.cardStates[i]}
                    alt={"A policy in the " + this.props.deckType.toLowerCase() + " deck."}
                    key={i}
                />
            )
        }
        return cards;
    }

    render() {
        return(
            <div id={"deck-container"} style={{position:"relative"}}>
                <p id={"deck-card-count"}>
                    {this.numCards}
                </p>
                <img id={"deck-base"}
                     src={(this.props.deckType === "DRAW" ? DrawDeck : DiscardDeck)}
                     alt={"The " + this.props.deckType.toLowerCase() + " deck. (" + this.props.cardCount + " policies)"}/>
                {this.getCards()}
            </div>
        );
    }
}

Deck.propTypes = {
    cardCount: PropTypes.number.isRequired,
    deckType: PropTypes.string.isRequired,
};

export default Deck;