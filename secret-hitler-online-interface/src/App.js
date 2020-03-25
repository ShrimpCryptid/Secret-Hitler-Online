import React, {Component} from 'react';
import './App.css';
import MaxLengthTextField from "./MaxLengthTextField";

const PAGE = {
    LOGIN: 'login',
    LOBBY: 'lobby',
    GAME: 'game'
};
const SERVER_ADDRESS = "http://localhost:4000";
const CHECK_LOGIN = "/check-login";
const LOBBY_CODE_LENGTH = 6;

class App extends Component {

    //<editor-fold desc="Style Constants">

    //</editor-fold>

    constructor(props) {
        super(props);
        this.state={
            page:PAGE.LOGIN,
            joinName:"",
            joinLobby:"",
            joinError:"",
            createLobbyName:"",
            createLobbyError:"",
            websocket:null
        }
    }

    //////////// Login Page
    // <editor-fold desc="Login Page">

    /**
     * Updates the "Name" field under Join Game.
     * @param text the text to update the text field to.
     */
    updateJoinName = (text) => {
        this.setState({
            joinName:text
        });
    };

    /**
     * Updates the Lobby field under Join Game.
     * @param text the text to update the text field to.
     */
    updateJoinLobby = (text) => {
        this.setState({
            joinLobby:text
        });
    };

    /**
     * Updates the Name field under Create Lobby.
     * @param text the text to update the text field to.
     */
    updateCreateLobbyName = (text) => {
        this.setState({
            joinLobbyName:text
        });
    };

    shouldJoinButtonBeEnabled() {
        return (this.state.joinLobby.length === LOBBY_CODE_LENGTH) && (this.state.joinName.length !== 0)
    }

    /**
     * Attempts to connect to the server and initiate a websocket connection.
     */
    onClickJoin = () => {
        this.checkLogin(this.state.joinName, this.state.joinLobby);
    };

    async checkLogin(name, lobby) {
        let response = await fetch(SERVER_ADDRESS + CHECK_LOGIN + "?name=" + name + "&lobby=" + lobby);
        console.log(response);
        if (response.ok) {
            console.log("ok!");
        } else {
            this.setState({
                joinError:response.statusText
            });
        }
    }

    renderLoginPage() {
        return (
            <div className="App">
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>
                <br/>
                <div>
                    <h2>JOIN A GAME</h2>
                    <MaxLengthTextField
                        label={"Lobby"}
                        onChange={this.updateJoinLobby}
                        value={this.state.joinLobby}
                        maxLength={LOBBY_CODE_LENGTH}
                        showCharCount={false}
                        forceUpperCase={true}
                    />

                    <MaxLengthTextField
                        label={"Name"}
                        onChange={this.updateJoinName}
                        value={this.state.joinName}
                        maxLength={12}
                    />
                    <h6>{this.state.joinError}</h6>
                    <button
                        onClick={this.onClickJoin}
                        disabled={!this.shouldJoinButtonBeEnabled()}
                    >
                        JOIN
                    </button>
                </div>
                <br/>
                <div>
                    <h2>CREATE A LOBBY</h2>
                    <MaxLengthTextField
                        label={"Name"}
                        onChange={this.updateCreateLobbyName}
                        value={this.state.createLobbyName}
                        maxLength={12}
                    />
                    <h6>{this.state.createLobbyError}</h6>
                    <button>CREATE LOBBY</button>
                </div>
        </div>
        );
    }

    //</editor-fold>

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
