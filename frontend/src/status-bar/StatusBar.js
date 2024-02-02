import './StatusBar.css';
import React, {Component} from "react";

class StatusBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: this.props.children
        };
        this.fadeAndReplaceText = this.fadeAndReplaceText.bind(this);
        this.getClass = this.getClass.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //console.log("New text: " + this.props.children);
        if (this.props.children !== this.state.text) {
            this.fadeAndReplaceText();
        }
    }

    fadeAndReplaceText() {
        //let text = document.getElementById("status-bar-text");
        setTimeout(() => {
                //text.className = text.className.replace("hide", "");
                this.setState({text:this.props.children});
            },
            250);
    }

    getClass() {
        if(this.state.text !== this.props.children) {
            return "hide-statusbar";
        } else {
            return "";
        }
    }

    render() {
        return (
            <div id="status-bar">
                <p id="status-bar-text" className={this.getClass()}>{this.state.text}</p>
            </div>
        );
    }
}

StatusBar.defaultProps = {

};

export default StatusBar;