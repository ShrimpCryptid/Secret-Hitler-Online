import React, {Component} from 'react';
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

import ETBoard from '../assets/board-election-tracker.png';
import ETToken from '../assets/board-tracker.png';

import './ElectionTrackerAlert.css';

class ElectionTrackerAlert extends Component {

    constructor(props) {
        super(props);
        let initialPos = "et-position-" + (this.props.trackerPosition - 1);
        let moveClass = "et-moveto-" + (this.props.trackerPosition);
        this.state = {
            trackerClass: initialPos
        };
        setTimeout(()=>this.setState({trackerClass:moveClass}), 500);
    }

    render() {
        return (
            <ButtonPrompt
                label={"LEGISLATURE FAILED"}
                renderHeader={() => {
                    return (<>
                            <p className={"left-align"}>
                                The election tracker advances by 1 every time a government fails to
                                (or refuses to) pass a policy, and resets whenever a policy is passed.
                            </p>
                            <p className={"left-align highlight"}>
                                When the tracker reaches 3, the top policy on the draw deck is instantly passed.
                                No presidential powers trigger and all term limits will be reset.
                            </p>
                        </>);
                }}
                buttonText={"OKAY"}
                buttonOnClick={this.props.closeAlert}
            >
                <div id={"election-tracker-container"}>
                    <img id="election-tracker-board"
                         src={ETBoard}
                         alt={"The election tracker board. A blue board with four circles, which the election tracker advances along."}
                    />
                    <img id="election-tracker-token"
                         className={this.state.trackerClass}
                         src={ETToken}
                         alt={"The election tracker token. It is at position " + this.props.trackerPosition + " out of 3."}
                     />
                </div>
            </ButtonPrompt>
        )
    }
}

ElectionTrackerAlert.propTypes = {
    trackerPosition: PropTypes.number.isRequired,
    closeAlert: PropTypes.func.isRequired,
};

export default ElectionTrackerAlert;