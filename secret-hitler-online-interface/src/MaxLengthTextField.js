import React, {Component} from "react";

/**
 * A MaxLengthTextField is a text field that has a constrained
 * String length, and includes labels and remaining character counters.
 */
class MaxLengthTextField extends Component {
    constructor(props) {
        super(props);
    }

    charactersLeft() {
        if (this.props.showCharCount) {
            return this.props.maxLength - this.props.value.length;
        } else {
            return "";
        }
    }

    handleChange = (event) => {
        let text = event.target.value;
        if (text.length > this.props.maxLength && this.props.maxLength !== -1) {
            text = text.substr(0, this.props.maxLength); // cut down the value.
        }
        if(this.props.forceUpperCase) {
            this.props.onChange(text.toUpperCase());
        } else {
            this.props.onChange(text);
        }
    }

    render() {
        return (
            <div style={{flexDirection:"column", margin:"10px"}}>
                <div style={{display:"flex", width:"calc(10px + 40vmin)", flexDirection:"row", marginLeft:"auto", marginRight:"auto"}}>
                    <p style={{margin:"2px"}}>{this.props.label}</p>
                    <p style={{margin:"2px", marginLeft:"auto"}}>{this.charactersLeft()}</p>
                </div>
                <input  id="MaxLengthTextField"
                        value={this.props.value}
                        onChange={this.handleChange}
                        placeholder={this.props.placeholder}
                />
            </div>
        );
    }
}

MaxLengthTextField.defaultProps = {
    maxLength: 12, /*Set to -1 to disable.*/
    label: "Label",
    placeholder: "",
    textAreaLabel: "Prompt Here",
    showCharCount: true, /*Shows the remaining characters left (before hitting the maxLength).*/
    forceUpperCase: false /*Set to true to make all character input uppercase.*/
};

export default MaxLengthTextField;