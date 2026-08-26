import React, { ReactElement } from "react";
import LiberalBoardImg from "../assets/board-liberal.png";
import ElectionTrackerImg from "../assets/board-tracker.png";
import PolicyLiberalImg from "../assets/board-policy-liberal.png";
import FascistBoard_5_6Img from "../assets/board-fascist-5-6.png";
import FascistBoard_7_8Img from "../assets/board-fascist-7-8.png";
import FascistBoard_9_10Img from "../assets/board-fascist-9-10.png";
import PolicyFascistImg from "../assets/board-policy-fascist.png";

import "./Board.css";

type BoardProps = {
  numFascistPolicies: number;
  numLiberalPolicies: number;
  electionTracker: number;
  numPlayers: number;
};

/**
 * Returns the correct board image based on the number of players in the game.
 * @requires this.props.numPlayers must in range [5, 10], inclusive.
 * @return {image} The Fascist board corresponding to the number of players.
 */
function getFascistBoard(numPlayers: number) {
  if (numPlayers <= 6) {
    return FascistBoard_5_6Img;
  } else if (numPlayers <= 8) {
    return FascistBoard_7_8Img;
  } else {
    return FascistBoard_9_10Img;
  }
}

export default function Board(props: BoardProps): ReactElement {
  /**
   * Places a series of repeating images.
   * @param count {number} the count of currently visible images.
   * @param totalCount {number} the total number of images to place.
   * @param src {Image} the image source to use for the tiles.
   * @param id {String} the HTML id to apply.
   * @param offset {String} the offset from the left of the first tile (given as a %)
   * @param spacing {String} the horizontal offset between each image (given as %)
   * @returns {<img>[]} an array of `<img>` tags of length `totalCount`. Each image has the given
   *          `id` identity, `src` as an image source. There will be {@code spacing} between each image, and
   *          all images will be offset by {@code offset}.
   *          The first {@code count} images from the left will be given the class-name "show", the remaining will be given
   *          the class-name "hide".
   */
  function placeRepeating(
    count: number,
    totalCount: number,
    src: string,
    id: string,
    offset: string,
    spacing: string,
  ): ReactElement[] {
    const images: ReactElement[] = [];
    for (let i = 0; i < totalCount; i++) {
      let className = i < count ? "show" : "hide";
      images[i] = (
        <img
          src={src}
          id={id}
          style={{
            position: "absolute",
            left: `calc(${offset} + ${i.toString()} * ${spacing})`,
          }}
          alt={""}
          className={className}
          key={i}
        />
      );
    }
    return images;
  }

  return (
    <div
      id="board-container"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        id="board-group"
        style={{ margin: "4px 10px", position: "relative" }}
      >
        <img
          id="board"
          src={LiberalBoardImg}
          alt={props.numLiberalPolicies + " liberal policies have been passed."}
        />
        <img
          id="election-tracker"
          src={ElectionTrackerImg}
          style={{
            position: "absolute",
            top: "74%",
            left: `calc(34.2% + ${props.electionTracker} * 9.16%)`,
            width: "3.2%",
          }}
          alt={
            "Election tracker at position " +
            props.electionTracker +
            " out of 3."
          }
        />
        {placeRepeating(
          props.numLiberalPolicies,
          5,
          PolicyLiberalImg,
          "policy",
          "18.2%",
          "13.54%",
        )}
      </div>

      <div
        id="board-group"
        style={{ margin: "4px 10px", position: "relative" }}
      >
        <img
          id="board"
          src={getFascistBoard(props.numFascistPolicies)}
          alt={props.numFascistPolicies + " fascist policies have been passed."}
        />
        {placeRepeating(
          props.numFascistPolicies,
          6,
          PolicyFascistImg,
          "policy",
          "11%",
          "13.6%",
        )}
      </div>
    </div>
  );
}
