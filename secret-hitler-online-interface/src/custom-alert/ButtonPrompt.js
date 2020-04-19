import React, {Component} from 'react';
import PropTypes from 'prop-types';

/**
 * A template set of contents for the CustomAlert class that holds a series of selectable options.
 */
class ButtonPrompt extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selection: undefined
        }
    }

    render() {
        return (
            <div>
                {this.props.renderLabel(this)}
                {this.props.renderHeader(this)}
                {this.props.children}
                {this.props.renderFooter(this)}
                {this.props.renderButton(this)}
            </div>
        );
    }
}

// noinspection JSUnusedGlobalSymbols
ButtonPrompt.defaultProps = {
    label: "LABEL GOES HERE",
    renderLabel: (obj) => {
        return (<h2 id={"prompt-label"} className={"left-align"}>{obj.props.label}</h2>);
    },

    headerText: "",
    renderHeader: (obj) => {
        return (
            <p id={"prompt-header"} className={"left-align"}>{obj.props.headerText}</p>
        );
    },

    footerText: "",
    renderFooter: (obj) => {
        return (
            <p id={"prompt-header"} className={"left-align"}>{obj.props.footerText}</p>
        );
    },

    buttonText: "CONFIRM",
    buttonOnClick: () => {console.log("Button clicked.")},
    buttonDisabled: false,
    renderButton: (obj) => {
        return (
            <button id={"prompt-button"} disabled={obj.props.buttonDisabled} onClick={obj.props.buttonOnClick}>
                {obj.props.buttonText}
            </button>
        );
    },

};

ButtonPrompt.propTypes = {
    label: PropTypes.string,
    renderLabel: PropTypes.func,
    headerText: PropTypes.string,
    renderHeader: PropTypes.func,

    onOptionSelected: PropTypes.func,
    renderOptions: PropTypes.func,

    footerText: PropTypes.string,
    renderFooter: PropTypes.func,

    buttonText: PropTypes.string,
    buttonOnClick: PropTypes.func,
    buttonDisabled: PropTypes.bool,
    renderButton: PropTypes.func
};


export default ButtonPrompt;