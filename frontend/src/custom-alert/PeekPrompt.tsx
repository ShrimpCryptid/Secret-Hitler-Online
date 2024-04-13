import React, { Component } from "react";
import { SERVER_TIMEOUT } from "../constants";
import PolicyDisplay from "../util/PolicyDisplay";
import ButtonPrompt from "./ButtonPrompt";
import { PolicyType, SendWSCommand, WSCommandType } from "../types";

type PeekPromptProps = {
  policies: PolicyType[];
  sendWSCommand: SendWSCommand;
};

type PeekPromptState = {
  waitingForServer: boolean;
  selection: number | undefined;
};

class PeekPrompt extends Component<PeekPromptProps, PeekPromptState> {
  timeoutID: NodeJS.Timeout | undefined;

  constructor(props: PeekPromptProps) {
    super(props);
    this.state = {
      waitingForServer: false,
      selection: undefined,
    };
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  onButtonClick() {
    // Lock the button so that it can't be pressed multiple times.
    this.setState({ waitingForServer: true });
    this.timeoutID = setTimeout(() => {
      this.setState({ waitingForServer: false });
    }, SERVER_TIMEOUT);

    // Contact the server using provided method.
    this.props.sendWSCommand({ command: WSCommandType.REGISTER_PEEK });
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutID);
  }

  render() {
    return (
      <ButtonPrompt
        label={"PEEK"}
        headerText={"These are the next three policies in the draw deck."}
        buttonText={"OKAY"}
        buttonOnClick={this.onButtonClick}
        buttonDisabled={this.state.waitingForServer}
      >
        <PolicyDisplay
          policies={this.props.policies}
          onClick={(index: number) => this.setState({ selection: index })}
          allowSelection={false}
        />
      </ButtonPrompt>
    );
  }
}

export default PeekPrompt;
