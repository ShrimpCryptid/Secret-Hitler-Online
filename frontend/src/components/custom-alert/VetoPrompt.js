import React, { Component } from "react";
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";
import {
	COMMAND_REGISTER_PRESIDENT_VETO,
	PARAM_VETO,
	SERVER_TIMEOUT,
} from "../../constants";

class VetoPrompt extends Component {
	constructor(props) {
		super(props);
		this.state = {
			waitingForServer: false,
		};
	}

	onButtonClick(accepted) {
		this.setState({ waitingForServer: true });
		setTimeout(
			() => this.setState({ waitingForServer: false }),
			SERVER_TIMEOUT
		);

		let data = {};
		data[PARAM_VETO] = accepted;
		this.props.sendWSCommand(COMMAND_REGISTER_PRESIDENT_VETO, data);
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

VetoPrompt.propTypes = {
	sendWSCommand: PropTypes.func.isRequired,
	electionTracker: PropTypes.number.isRequired,
};

export default VetoPrompt;
