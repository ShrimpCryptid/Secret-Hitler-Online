import React, {Component} from 'react';
import './CustomAlert.css'

class CustomAlert extends Component {

    constructor(props) {
        super(props);
        this.state = {
            lastValueShow: false,
            backgroundClass: "",
            alertBoxClass: ""
        };
    }

    /**
     * If the value of {@code this.props.show} changes from false to true, adds/replaces class with "show".
     * If it changes from true to false, adds/replaces class with "hide".
     */
    updateClasses() {
        if (this.props.show !== this.state.lastValueShow) {
            this.setState({lastValueShow: this.props.show});
            if (this.props.show) { // alert box should appear
                console.log("Make appear");
                this.setState({
                    backgroundClass: "appear",
                    alertBoxClass: "appear"
                });
            } else {
                console.log("Make disappear");
                this.setState({
                    backgroundClass: "disappear",
                    alertBoxClass: "disappear"
                });
            }
        }
    }

    getClass() {
        if(this.props.show) {
            return "appear";
        } else {
            return "disappear";
        }
    }

    render() {
        return (
            <div id="alert" className={this.getClass()}>
                <div id="alert-background" className={this.getClass()}/>
                <div id="alert-box" className={this.getClass()}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default CustomAlert;