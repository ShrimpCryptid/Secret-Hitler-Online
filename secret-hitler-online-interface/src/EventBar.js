import React, {Component} from 'react';
import "./EventBar.css";

class EventBar extends Component {

    getClass() {
        if (this.props.show) {
            return "appear";
        } else {
            return "disappear";
        }
    }

    render() {
        return (
            <div id="event-bar" className={this.getClass()}>
                <div id="bar-background" className={this.getClass()} />
                <h1 id="event-bar-text" className={this.getClass()}>{this.props.message}</h1>
            </div>
        );
    }
}

EventBar.defaultProps = {
    message: "CHANCELLOR NOMINATION",
    show: true
};

export default EventBar;