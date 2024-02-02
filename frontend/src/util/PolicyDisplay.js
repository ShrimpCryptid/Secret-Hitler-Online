import React, { Component } from "react";
import PropTypes from "prop-types";
import "./PolicyDisplay.css";
import { LIBERAL } from "../constants";
import LiberalPolicy from "../assets/policy-liberal.png";
import FascistPolicy from "../assets/policy-fascist.png";

class PolicyDisplay extends Component {
	render() {
		return (
			<div id={"legislative-policy-container"}>
				{this.props.policies.map((value, index) => {
					let policyName = value === LIBERAL ? "liberal" : "fascist";
					return (
						<img
							id={"legislative-policy"}
							key={index}
							className={
								this.props.allowSelection
									? "selectable " +
									  (index === this.props.selection ? " selected" : "")
									: ""
							}
							onClick={() => this.props.onClick(index)}
							disabled={!this.props.allowSelection}
							src={value === LIBERAL ? LiberalPolicy : FascistPolicy} // Toggles fascist/liberal policy
							alt={
								"A " +
								policyName +
								" policy." +
								(this.props.allowSelection ? " Click to select." : "")
							}
						/>
					);
				})}
			</div>
		);
	}
}

PolicyDisplay.propTypes = {
	policies: PropTypes.array.isRequired,
	onClick: PropTypes.func, // If undefined, the policies cannot be selected.
	selection: PropTypes.number,
	allowSelection: PropTypes.bool,
};

export default PolicyDisplay;
