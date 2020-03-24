import {Component} from "react";

class MaxLengthTextField extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text:"",
            maxLength:6,
        }
    }

    defaultStyle() {
        return {
            fontSize: "calc(4px + 2vmin)", /*This means 10px plus 2% of the window's smallest dimension.*/
            fontFamily: this.bodyFont,
            color: "#69645e"
        };
    }

    getLabelStyle() {
        if (this.props.labelStyle === undefined) {
            return this.defaultStyle();
        } else {
            return this.props.labelStyle;
        }
    }

    render() {
        return (
            <p style = {this.props.labelStyle}>{this.props.label}</p>
        );
    }
}

MaxLengthTextField.defaultProps = {

}