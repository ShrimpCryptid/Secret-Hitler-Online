import React, { Component } from "react";
import "../selectable.css";
import "./IconSelection.css";
import Cookies from "js-cookie";
// TODO: Remove this package!
import { TwitterShareButton } from "react-twitter-embed";
import portraits, {
  unlockedPortraits,
  lockedPortraits,
  defaultPortrait,
} from "../assets";
import { portraitsAltText } from "../assets";

import ButtonPrompt from "./ButtonPrompt";
import { SendWSCommand, WSCommandType } from "../types";

export const UNLOCK_ICONS_COOKIE_NAME = "_unlock_icons";

type IconSelectionProps = {
  playerToIcon: Record<string, string>;
  players: string[];
  sendWSCommand: SendWSCommand;
  user: string;
  onConfirm: () => void;
  onClickTweet: () => void;
};

type IconSelectionState = {
  unlockLockedIcons: boolean;
  showLockedPrompt: boolean;
};

class IconSelection extends Component<IconSelectionProps, IconSelectionState> {
  timeoutID: NodeJS.Timeout | undefined;

  constructor(props: IconSelectionProps) {
    super(props);

    // Check if the locked icons prompt should be shown. (using cookies!)
    let hasUserUnlockedIcons = false;
    if (Cookies.get(UNLOCK_ICONS_COOKIE_NAME)) {
      hasUserUnlockedIcons = true;
    }

    this.state = {
      unlockLockedIcons: hasUserUnlockedIcons,
      showLockedPrompt: !hasUserUnlockedIcons,
    };

    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.getIconButtonHML = this.getIconButtonHML.bind(this);
    this.isIconInUse = this.isIconInUse.bind(this);
    this.onClickUnlock = this.onClickUnlock.bind(this);
    this.addTwitterHooks = this.addTwitterHooks.bind(this);
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID);
  }

  isIconInUse(iconID: string) {
    let playerOrder = this.props.players;
    for (let i = 0; i < playerOrder.length; i++) {
      let player = playerOrder[i];
      if (this.props.playerToIcon[player] === iconID) {
        return true;
      }
    }
    return false;
  }

  onClickIcon(iconID: string) {
    // Verify that player is able to select this icon.
    let isPremium = lockedPortraits.indexOf(iconID) !== -1;
    // Also does not allow selection if user has already selected this icon
    let unselectable =
      (isPremium && !this.state.unlockLockedIcons) || this.isIconInUse(iconID);

    if (!unselectable) {
      // This is a valid choice according to our current game state
      // Register the selection with the server.
      // Contact the server using provided method.
      this.props.sendWSCommand({
        command: WSCommandType.SELECT_ICON,
        icon: iconID,
      });
    }
  }

  /**
   * Called when any icon is clicked.
   * @effects Attempts to send the server a command with the player's vote, and locks access to the button
   *          for {@code SERVER_TIMEOUT} ms.
   */
  onConfirmButtonClick() {
    // Check that user has a profile picture assigned according to the game state
    if (this.props.playerToIcon[this.props.user] !== defaultPortrait) {
      this.props.onConfirm();
    }
  }

  getIconButtonHML(portraitNames: string[]): React.JSX.Element {
    // Update selections based on game state given by the server (this prevents duplicate player icons).

    let currPortrait = this.props.playerToIcon[this.props.user];

    const iconHTML: (React.JSX.Element | undefined)[] = portraitNames.map(
      (portraitID, index: number) => {
        // Check if valid portrait name
        if (portraits.hasOwnProperty(portraitID)) {
          // Disable locked icons or icons currently selected by other players.
          let isIconAvailable =
            !this.isIconInUse(portraitID) || portraitID === currPortrait;
          let isIconUnlocked =
            lockedPortraits.indexOf(portraitID) === -1 ||
            this.state.unlockLockedIcons;
          let isEnabled = isIconUnlocked && isIconAvailable;
          let isSelected = currPortrait === portraitID;
          // TODO: Convert this to a button since a clickable div is not accessible.
          return (
            <img
              id={"icon"}
              key={index}
              className={
                "selectable" +
                (isSelected ? " selected" : "") +
                (!isEnabled ? " disabled" : "")
              } // Determines if selected / selectable
              alt={portraitsAltText[portraitID]}
              src={portraits[portraitID]}
              draggable={false}
              onClick={() => this.onClickIcon(portraitID)}
            ></img>
          );
        }
      }
    );

    // Return all the icons in a div container.
    return <div id={"icon-container"}>{iconHTML}</div>;
  }

  onClickUnlock() {
    // Unlock the icons
    this.setState({ unlockLockedIcons: true });
    // Set cookie signaling that this action has occurred, which gives the player a different
    // icon selection screen on the next load.
    Cookies.set(UNLOCK_ICONS_COOKIE_NAME, "true", { expires: 365 });
    // Callback for analytics logging
    this.props.onClickTweet();
  }

  addTwitterHooks() {
    window.twttr.ready((twttr) => {
      twttr.events.bind("tweet", this.onClickUnlock);
    });
  }

  render() {
    let headerPortraits: string[];
    let footerContent: () => React.ReactNode;
    if (this.state.showLockedPrompt) {
      headerPortraits = unlockedPortraits;
      footerContent = () => {
        return (
          <>
            <h2 style={{ textAlign: "left" }}>EXTRA ICONS:</h2>
            <div id={"locked-icon-text-container"}>
              <p id={"icon-text"} style={{ textAlign: "left" }}>
                Unlock these {lockedPortraits.length} extra icons by sharing
                this website! I'd really like for more people to enjoy this
                game, so this would be a big help.
              </p>
              <TwitterShareButton
                url={"https://secret-hitler.online!"}
                options={{
                  text: "I'm playing #SecretHitlerOnline at",
                  size: "large",
                }}
                onLoad={this.addTwitterHooks}
                placeholder={
                  <p
                    id={"icon-text"}
                    style={{ color: "var(--textColorLiberal)" }}
                  >
                    Loading...
                  </p>
                }
              />
            </div>
            {this.getIconButtonHML(lockedPortraits)}
          </>
        );
      }; // end footer content
    } else {
      headerPortraits = unlockedPortraits.concat(lockedPortraits);
      footerContent = () => {
        return (
          <>
            <div id={"locked-icon-text-container"}>
              <p>
                (You unlocked {lockedPortraits.length} extra icons by sharing
                Secret Hitler Online! Thank you! 💖)
              </p>
              <TwitterShareButton
                url={"https://secret-hitler.online!"}
                options={{
                  text: "I'm playing #SecretHitlerOnline at",
                  size: "large",
                }}
                onLoad={this.addTwitterHooks}
                placeholder={
                  <p
                    id={"icon-text"}
                    style={{ color: "var(--textColorLiberal)" }}
                  >
                    Loading...
                  </p>
                }
              />
            </div>
          </>
        );
      }; // end footer content
    }

    return (
      <ButtonPrompt
        label={"PLAYER LOOK"}
        renderHeader={() => {
          return (
            <>
              <p>Choose a look, then press confirm.</p>
              {this.getIconButtonHML(headerPortraits)}
            </>
          );
        }}
        renderFooter={footerContent}
        buttonDisabled={
          this.props.playerToIcon[this.props.user] === defaultPortrait
        }
        buttonOnClick={this.onConfirmButtonClick}
      ></ButtonPrompt>
    );
  }
}

export default IconSelection;
