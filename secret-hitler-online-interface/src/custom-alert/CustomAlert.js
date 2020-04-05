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

    getClass() {
        if(this.props.show) {
            return "appear-custom-alert";
        } else {
            return "disappear-custom-alert";
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