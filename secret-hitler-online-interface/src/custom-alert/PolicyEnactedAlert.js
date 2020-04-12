import React, {Component} from 'react';
import PropTypes from "prop-types";
import OptionPrompt from "./OptionPrompt";

import LiberalPolicy from '../assets/policy-liberal.png';
import FascistPolicy from '../assets/policy-fascist.png';
import FolderCoverFront from '../assets/policy-folder-cover-front.png';
import FolderCoverBack from '../assets/policy-folder-cover-back.png';
import FolderBack from '../assets/policy-folder-back.png';

import './PolicyEnactedAlert.css';
import {LIBERAL} from "../GlobalDefinitions";

class PolicyEnactedAlert extends Component {

    constructor(props) {
        super(props);
        this.state = {
            className: ""
        };
        this.setAnimation = this.setAnimation.bind(this);
        this.setAnimation();

    }

    setAnimation() {
        this.setState({className: ""});
        setTimeout(()=> {this.setState({className: "show-policy-1"})}, 1000);
        setTimeout(()=> {this.setState({className: "show-policy-2"})}, 1400);
    }

    render() {
        return (
            <OptionPrompt
                renderLabel={() => {
                    return <h2>POLICY ENACTED</h2> // allows us to align it with center
                }}
                buttonText={"OKAY"}
                buttonOnClick={this.setAnimation}
            >
                <div id={"policy-enacted-container"}>
                    <img id={"policy-enacted-cover-front"}
                         src={FolderCoverFront}
                         className={this.state.className}
                         alt={"A manila folder labeled 'New Policy.'"}
                    />
                    <img id={"policy-enacted-cover-back"}
                         src={FolderCoverBack}
                         className={this.state.className}
                         alt={"A manila folder labeled 'New Policy.'"}
                    />
                    <img id={"policy-enacted-policy"}
                         className={this.state.className}
                         src={LiberalPolicy} alt={"A " + this.props.policyType.toLowerCase() + " policy that was enacted! " +
                                                  this.props.policyType === LIBERAL ? "It's printed in blue with a dove insignia on it."
                                                  : "It's printed in red with a skull insignia on it."}
                    />
                    <img id={"policy-enacted-back"}
                         className={this.state.className}
                         src={FolderBack}
                         alt={""}
                    />
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