import React, { ReactElement, useEffect, useState } from "react";
import ButtonPrompt from "./ButtonPrompt";

import ETBoard from "../assets/board-election-tracker.png";
import ETToken from "../assets/board-tracker.png";

import "./ElectionTrackerAlert.css";

type ElectionTrackerAlertProps = {
  trackerPosition: number;
  closeAlert: () => void;
};

export default function ElectionTrackerAlert(
  props: ElectionTrackerAlertProps
): ReactElement {
  const [trackerClass, setTrackerClass] = useState(
    "et-position-" + (props.trackerPosition - 1)
  );

  useEffect(() => {
    let moveClass = "et-moveto-" + props.trackerPosition;
    setTimeout(() => setTrackerClass(moveClass), 500);
  }, [props.trackerPosition]);

  return (
    <ButtonPrompt
      label={"LEGISLATURE FAILED"}
      renderHeader={() => {
        return (
          <>
            <p className={"left-align"}>
              The election tracker advances by 1 every time a government fails
              to (or refuses to) pass a policy, and resets whenever a policy is
              passed.
            </p>
            <p className={"left-align highlight"}>
              When the tracker reaches 3, the top policy on the draw deck is
              instantly passed. No presidential powers trigger and all term
              limits will be reset.
            </p>
          </>
        );
      }}
      buttonText={"OKAY"}
      buttonOnClick={props.closeAlert}
    >
      <div id={"election-tracker-container"}>
        <img
          id="election-tracker-board"
          src={ETBoard}
          alt={
            "The election tracker board. A blue board with four circles, which the election tracker advances along."
          }
        />
        <img
          id="election-tracker-token"
          className={trackerClass}
          src={ETToken}
          alt={
            "The election tracker token. It is at position " +
            props.trackerPosition +
            " out of 3."
          }
        />
      </div>
    </ButtonPrompt>
  );
}
