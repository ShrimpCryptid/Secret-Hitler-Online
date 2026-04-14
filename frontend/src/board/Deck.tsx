import React, { useCallback, useEffect, useMemo, useState } from "react";
import DiscardDeck from "../assets/board-discard.png";
import DrawDeck from "../assets/board-draw.png";
import PolicyBack from "../assets/board-policy.png";
import { DeckType } from "../types";

import "./Deck.css";

const MAX_CARDS = 17;

// Classnames for transition states and final states of cards in the deck.
const FINAL_HIDE = "deck-final-hide";
const FINAL_SHOW = "deck-final-show";
const TRANSITION_SHOW = "deck-transition-show";
const TRANSITION_HIDE = "deck-transition-hide";

const HIDE_TRANSITION_DURATION_MS = 510;
const SHOW_TRANSITION_DURATION_MS = 300;

type DeckProps = {
  cardCount: number;
  deckType: DeckType;
};

export default function Deck(props: DeckProps) {
  const [cardClassnames, setCardClassnames] = useState<string[]>(() => {
    // Initialize classnames based on the initial card count, so the first
    // `cardCount` cards are shown and the rest are hidden.
    const initialStates = Array(MAX_CARDS).fill(FINAL_HIDE);
    for (let i = 0; i < props.cardCount; i++) {
      initialStates[i] = FINAL_SHOW;
    }
    return initialStates;
  });
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const lastCardCountRef = React.useRef(props.cardCount);

  const setCardClassname = useCallback((i: number, className: string) => {
    setCardClassnames((prev) => {
      const newClassnames = [...prev];
      newClassnames[i] = className;
      return newClassnames;
    });
  }, []);

  const animateCardVisibility = useCallback((i: number, visible: boolean) => {
    const transitionState = visible ? TRANSITION_SHOW : TRANSITION_HIDE;
    const finalState = visible ? FINAL_SHOW : FINAL_HIDE;
    const durationMs = visible
      ? SHOW_TRANSITION_DURATION_MS
      : HIDE_TRANSITION_DURATION_MS;
    // Start transition and set final state after the duration of the
    // transition.
    setCardClassname(i, transitionState);
    setTimeout(() => {
      setCardClassname(i, finalState);
    }, durationMs);
  }, []);

  useEffect(() => {
    if (lastCardCountRef.current === props.cardCount || isPlayingAnimation) {
      return;
    }
    // Number of cards has changed, play an animation.
    setIsPlayingAnimation(true);
    let perCardDelayMs = 150;
    let totalDelayMs = 0;
    const oldCount = lastCardCountRef.current;
    const newCount = props.cardCount;

    if (newCount < oldCount) {
      // Cards were taken out of the deck
      const difference = oldCount - newCount;
      perCardDelayMs = difference <= 3 ? 350 : 150;
      for (let i = oldCount - 1; i >= newCount; i--) {
        setTimeout(() => {
          animateCardVisibility(i, false);
        }, totalDelayMs);
        totalDelayMs += perCardDelayMs;
      }
    } else {
      // Cards were added to the deck
      perCardDelayMs = 150;
      for (let i = oldCount; i < newCount; i++) {
        setTimeout(() => {
          animateCardVisibility(i, true);
        }, totalDelayMs);
        totalDelayMs += perCardDelayMs;
      }
    }
    // Reset animation state after all animations complete.
    setTimeout(() => {
      setIsPlayingAnimation(false);
    }, totalDelayMs);
    lastCardCountRef.current = props.cardCount;
  }, [props.cardCount]);

  const cardElements = useMemo(() => {
    const topOffset = 9;
    const topDistance = 2;

    const cards = Array.from({ length: MAX_CARDS }).map((_, i) => {
      let top = topOffset - topDistance * i;
      if (cardClassnames[i] === FINAL_HIDE) {
        // Move the hidden card up so it transitions in later.
        top -= 15;
      }
      return (
        <img
          src={PolicyBack}
          id={"deck-policy"}
          style={{ top: top + "%" }}
          className={cardClassnames[i]}
          alt={"A policy in the " + props.deckType.toLowerCase() + " deck."}
          key={i}
        />
      );
    });

    return cards;
  }, [cardClassnames, props.deckType]);

  return (
    <div id={"deck-container"} style={{ position: "relative" }}>
      <p id={"deck-card-count"}>{props.cardCount}</p>
      <img
        id={"deck-base"}
        src={props.deckType === "DRAW" ? DrawDeck : DiscardDeck}
        alt={
          "The " +
          props.deckType.toLowerCase() +
          " deck. (" +
          props.cardCount +
          " policies)"
        }
      />
      {cardElements}
    </div>
  );
}
