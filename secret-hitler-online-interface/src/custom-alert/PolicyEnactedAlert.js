import React, {Component} from 'react';
import PropTypes from "prop-types";
import OptionPrompt from "./OptionPrompt";

import LiberalPolicy from '../assets/policy-liberal.png';
import FascistPolicy from '../assets/policy-fascist.png';

import './PolicyEnactedAlert.css';

class PolicyEnactedAlert extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showPolicy: false
        };
        setTimeout(()=> {this.setState({showPolicy: true})}, 500);
    }

    render() {
        return (
            <OptionPrompt
                renderLabel={() => {
                    return <h2>POLICY ENACTED</h2> // allows us to align it with center
                }}
                buttonText={"OKAY"}
            >
                <div id={"policy-enacted-container"}>
                    <img id={"policy-enacted-policy"}
                         className={this.state.showPolicy ? "policy-alert-show" : ""}
                         src={LiberalPolicy} alt={"A " + this.props.policyType.toLowerCase() + " policy was enacted!"}/>
                </div>
            </OptionPrompt>
        );
    }
}

PolicyEnactedAlert.propTypes = {
    hideAlert: PropTypes.func.isRequired,
    policyType: PropTypes.string.isRequired
};

export default PolicyEnactedAlert;