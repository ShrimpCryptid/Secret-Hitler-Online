import React, { Component } from "react";
import ButtonPrompt from "./ButtonPrompt";
import { SERVER_TIMEOUT } from "../constants";
import { SendWSCommand, WSCommandType } from "../types";

type VetoPromptProps = {
  sendWSCommand: SendWSCommand;
  electionTracker: number;
};

type VetoPromptState = {
  waitingForServer: boolean;
};

class VetoPrompt extends Component<VetoPromptProps, VetoPromptState> {
  constructor(props: VetoPromptProps) {
    super(props);
    this.state = {
      waitingForServer: false,
    };
  }

  onButtonClick(accepted: boolean) {
    this.setState({ waitingForServer: true });
    setTimeout(
      () => this.setState({ waitingForServer: false }),
      SERVER_TIMEOUT
    );

    this.props.sendWSCommand({
      command: WSCommandType.REGISTER_PRESIDENT_VETO,
      veto: accepted,
    });
  }

  render() {
    return (
      <ButtonPrompt
        label={"LEGISLATIVE VETO"}
        renderHeader={() => {
          return (
            <>
              <p className={"left-align"}>
                The chancellor has requested to veto the agenda.
              </p>
              {this.props.electionTracker === 2 && (
                <p className={"left-align highlight"}>
                  If the veto is accepted, the top policy on the draw pile will
                  be automatically enacted.
                </p>
              )}
              {this.props.electionTracker !== 2 && (
                <p className={"left-align"}>
                  If the veto is accepted, the remaining policies will be
                  discarded and the election tracker will advance by 1.
                </p>
              )}
              <p className={"left-align"}>
                Otherwise, the chancellor will be required to enact a policy as
                normal.
              </p>
              <br />
            </>
          );
        }}
        footerText={"Accept the veto?"}
        renderButton={() => {
          return (
            <>
              <button
                onClick={() => this.onButtonClick(false)}
                disabled={this.state.waitingForServer}
              >
                REJECT
              </button>
              <button
                onClick={() => this.onButtonClick(true)}
                disabled={this.state.waitingForServer}
              >
                ACCEPT
              </button>
            </>
          );
        }}
      />
    );
  }
}

export default VetoPrompt;
