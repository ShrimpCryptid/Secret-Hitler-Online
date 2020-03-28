import React, {Component} from 'react';

import './Player.css'
import {Textfit} from 'react-textfit';

import PlayerBase from "./assets/player-base.png"
import PlayerBaseDisabled from "./assets/player-base-unselectable.png";

import IconFascist from "./assets/player-icon-fascist.png";
import IconHitler from "./assets/player-icon-hitler.png";
import IconLiberal from "./assets/player-icon-liberal.png";

const LIBERAL = "LIBERAL";
const FASCIST = "FASCIST";
const HITLER = "HITLER";

class Player extends Component {

    getImg() {
        if (this.props.disabled) {
            return PlayerBaseDisabled;
        } else {
            return PlayerBase;
        }
    }

    getIcon() {
        switch (this.props.role) {
            case LIBERAL:
                return IconLiberal;
            case FASCIST:
                return IconFascist;
            case HITLER:
                return IconHitler;
        }
    }

    getLabel() {
        switch (this.props.role) {
            case LIBERAL:
                return "Liberal";
            case FASCIST:
                return "Fascist";
            case HITLER:
            default:
                return "Hitler";
        }
    }

    getRoleClass() {
        if(this.props.role === LIBERAL) {
            return "liberal-text";
        } else {
            return "";
        }
    }

    render() {
        return (
            <div id="player-container">
                <Textfit id={"player-name"} mode="multi" forceSingleModeWidth={false}>{this.props.name}</Textfit>

                <img id="player-icon" src={this.getImg()} alt={this.props.name} />
                <img id="player-identity-icon" src={this.getIcon()} hidden={!this.props.showRole}/>
                <p id="player-identity-label" className={this.getRoleClass()} hidden={!this.props.showRole}>{this.getLabel()}</p>

             </div>
        );
    }

}

Player.defaultProps = {
    isBusy: false,
    name: "Name Here",
    role: "FASCIST",
    showRole: true,
    disabled: false
};

export default Player;