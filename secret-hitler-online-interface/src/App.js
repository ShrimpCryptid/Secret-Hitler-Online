import React, {Component} from 'react';
import './App.css';

const PAGE = {
    LOGIN: 'login',
    LOBBY: 'lobby',
    GAME: 'game'
};

class App extends Component {

    //<editor-fold desc="Style Constants">
    headerFont = "Germania One";
    bodyFont = "Montserrat";
    colorHeader = "#e05b2b";
    colorBackground1 = "#4d4945";
    colorBackground2 = "#372e25";
    colorFontWhite = "#ffffff";
    colorFontOnWhite = "#69645e";
    colorFontOnDark = "#bbbbbb";
    colorFontHighlight = this.colorHeader;

    //</editor-fold>

    constructor(props) {
        super(props);
        this.state={
            page:PAGE.LOGIN
        }
    }

    //<editor-fold desc="Style Methods">
    ribbonStyle = {
        backgroundColor: this.colorHeader,
        minHeight: "6vh", /*This means 8% of the viewport height.*/
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: "calc(6px + 4vmin)", /*This means 10px plus 2% of the window's smallest dimension.*/
        fontFamily: this.headerFont,
        color: this.colorFontWhite
    };

    headerStyle(color) {
        if (!color) {
            color = this.colorFontWhite;
        }
        return {
            fontSize: "calc(6px + 4vmin)", /*This means 10px plus 2% of the window's smallest dimension.*/
            fontFamily: this.headerFont,
            color: color
        };
    };

    bodyStyle(color, size) {
        if (!color) {
            color = this.colorFontWhite;
        }
        if (!size) {
            size = "calc(4px + 2vmin)";
        }
        return {
            fontSize: size, /*This means 10px plus 2% of the window's smallest dimension.*/
            fontFamily: this.bodyFont,
            color: color
        };
    }
    //</editor-fold>

    renderLoginPage() {
        return (
            <div className="App" style={{background:this.colorBackground1, minHeight:"100vh", textAlign:"center"}}>
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>
                <br/>
                <h2>JOIN GAME</h2>
                <p>Lobby field here</p>
                <p>Name field here</p>
                <h6>Error messages can go here.</h6>
                <button>JOIN GAME</button>
                <br/>
                <h2>CREATE A LOBBY</h2>
                <p>Name field here</p>
                <h6>Error messages can go here.</h6>
                <button>CREATE LOBBY</button>
        </div>
        );
    }

    render() {
        switch (this.state.page) {
            case PAGE.LOGIN:
                return this.renderLoginPage();
            case PAGE.LOBBY:
                break;
            case PAGE.GAME:
                break;
        }
    }
}

export default App;
