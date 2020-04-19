import React, {Component} from 'react';
import PropTypes from "prop-types";
import './PolicyDisplay.css';
import {LIBERAL} from "../GlobalDefinitions";
import LiberalPolicy from "../assets/policy-liberal.png";
import FascistPolicy from "../assets/policy-fascist.png";

class PolicyDisplay extends Component {
    render() {
        let selectable = this.props.onClick !== undefined;
        return (
            <div id={"legislative-policy-container"}>
                {this.props.policies.map((value, index) => {
                    let policyName = value === LIBERAL ? "liberal" : "fascist";
                    return (
                        <img
                            id={"legislative-policy"}
                            className={selectable ? "selectable " + (index === this.props.selection ? " selected" : ""):""}
                            onClick={() => this.props.onClick(index)}
                            disabled={!selectable}
                            src={value === LIBERAL ? LiberalPolicy : FascistPolicy} // Toggles fascist/liberal policy
                            alt={"A " + policyName + " policy." + (selectable ? " Click to select." : "")}
                        />
                    );
                } )}
            </div>
        );
    }
}

PolicyDisplay.propTypes = {
    policies: PropTypes.array.isRequired,
    onClick: PropTypes.func,  // If undefined, the policies cannot be selected.
    selection: PropTypes.number,
};

export default PolicyDisplay;