import React, {Component} from 'react';
import RoleHitler from "./assets/role-hitler.png";

class CustomAlert extends Component {

    constructor(props) {
        super(props);
        this.setState({
            lastValueShow: false
        })
    }

    /**
     * If the value of {@code this.props.show} changes, changes the className from
     */
    getClassName() {

    }

    render() {
        return (
            <div id="alert" className={this.props.show}>
                <div id="alert-background"/>
                <div id="alert-box">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default CustomAlert;