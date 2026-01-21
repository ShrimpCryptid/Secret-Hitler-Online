import React, { Component } from "react";
import ButtonPrompt from "./ButtonPrompt";
import { SERVER_TIMEOUT } from "../constants";

import "../util/PolicyDisplay.css";
import PolicyDisplay from "../util/PolicyDisplay";
import { PolicyType, SendWSCommand, WSCommandType } from "../types";

type ChancellorLegislativePromptProps = {
  policyOptions: PolicyType[];
  sendWSCommand: SendWSCommand;
  fascistPolicies: number;
  showError: (message: string) => void;
  enableVeto: boolean;
};

type ChancellorLegislativePromptState = {
  selection: number | undefined;
  waitingForServer: boolean;
};

class ChancellorLegislativePrompt extends Component<
  ChancellorLegislativePromptProps,
  ChancellorLegislativePromptState
> {
  constructor(props: ChancellorLegislativePromptProps) {
    super(props);
    this.state = {
      selection: undefined,
      waitingForServer: false,
    };
    this.onEnactButtonClick = this.onEnactButtonClick.bind(this);
    this.onVetoButtonClick = this.onVetoButtonClick.bind(this);
  }

  onEnactButtonClick() {
    if (this.state.selection === undefined) {
      return;
    }
    // Lock the button so that it can't be pressed multiple times.
    this.setState({ waitingForServer: true });
    setTimeout(() => {
      this.setState({ waitingForServer: false });
    }, SERVER_TIMEOUT);

    // Contact the server using provided method.
    this.props.sendWSCommand({
      command: WSCommandType.REGISTER_CHANCELLOR_CHOICE,
      choice: this.state.selection,
    });
  }

  onVetoButtonClick() {
    if (this.props.fascistPolicies === 5) {
      // If veto power is activated:
      // Lock the button so that it can't be pressed multiple times.
      this.setState({ waitingForServer: true });
      setTimeout(() => {
        this.setState({ waitingForServer: false });
      }, SERVER_TIMEOUT);

      this.props.sendWSCommand({
        command: WSCommandType.REGISTER_CHANCELLOR_VETO,
      });
    } else {
      // veto power is not activated
      this.props.showError(
        "Veto power is unlocked when there are 5 fascist policies."
      );
    }
  }

  // noinspection DuplicatedCode
  render() {
    let props = this.props;
    return (
      <ButtonPrompt
        label={"LEGISLATIVE SESSION"}
        headerText={
          "Choose a policy to enact. The remaining policy will be discarded."
        }
        renderHeader={() => {
          return (
            <>
              <p className={"left-align"}>
                Choose a policy to enact. The remaining policy will be
                discarded.
              </p>
              {props.fascistPolicies === 5 && (
                <p className={"left-align highlight"}>
                  Veto power unlocked: If you choose to veto and the president
                  agrees to the veto, the agenda will be discarded.
                </p>
              )}
            </>
          );
        }}
        renderButton={() => {
          return (
            <div id={"legislative-button-container"}>
              {this.props.enableVeto && (
                <button
                  onClick={this.onVetoButtonClick}
                  disabled={this.state.waitingForServer}
                >
                  VETO
                </button>
              )}
              <button
                onClick={this.onEnactButtonClick}
                disabled={
                  this.state.selection === undefined ||
                  this.state.waitingForServer
                }
              >
                ENACT
              </button>
            </div>
          );
        }}
      >
        <PolicyDisplay
          policies={this.props.policyOptions}
          onClick={(index: number) => this.setState({ selection: index })}
          selection={this.state.selection}
          allowSelection={true}
        />
      </ButtonPrompt>
    );
  }
}

export default ChancellorLegislativePrompt;
