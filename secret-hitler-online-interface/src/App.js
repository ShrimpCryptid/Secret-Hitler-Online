import React, {Component} from 'react';
import './App.css';
import MaxLengthTextField from "./MaxLengthTextField";

const PAGE = {
    LOGIN: 'login',
    LOBBY: 'lobby',
    GAME: 'game'
};
const SERVER_ADDRESS = "localhost:4000";
const SERVER_ADDRESS_HTTP = "http://" + SERVER_ADDRESS;
const CHECK_LOGIN = "/check-login";
const NEW_LOBBY = '/new-lobby';
const WEBSOCKET = '/game';
const LOBBY_CODE_LENGTH = 6;

class App extends Component {

    //<editor-fold desc="Style Constants">

    //</editor-fold>

    constructor(props) {
        super(props);
        this.state={
            page:PAGE.LOBBY,
            joinName:"",
            joinLobby:"",
            joinError:"",
            createLobbyName:"",
            createLobbyError:"",
            name:"",
            lobby:"AAAAAA",
            websocket:null
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    onWebSocketMessage(msg) {
        console.log(msg);
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
            createLobbyName:text
        });
    };

    shouldJoinButtonBeEnabled() {
        return (this.state.joinLobby.length === LOBBY_CODE_LENGTH) && (this.state.joinName.length !== 0)
    }

    shouldCreateLobbyButtonBeEnabled() {
        return (this.state.createLobbyName.length !== 0);
    }

    /**
     * Attempts to connect to the lobby via websocket.
     */
    onClickJoin = async () => {
        this.setState({joinError:"Connecting..."});
        let response = await this.tryLogin(this.state.joinName, this.state.joinLobby);
        if (response.ok) {
            // Username and lobby were verified. Try to open websocket.
            if (!this.tryOpenWebSocket(this.state.joinName, this.state.joinLobby)){
                this.setState({joinError:"There was an error connecting to the server. Please try again."});
            }
        } else if (response.status === 404) {
            this.setState({joinError:"The lobby could not be found."});
        } else if (response.status === 400) {
            this.setState({joinError:"There is already a user with the name '" + this.state.joinName + "' in the lobby."});
        } else {
            this.setState({joinError:"There was an error connecting to the server. Please try again."});
        }
    };

    /**
     * Attempts to connect to the server and create a new lobby, and then opens a connection to the lobby.
     */
    onClickCreateLobby = async () => {
        this.setState({createLobbyError:"Connecting..."});
        let response = await this.tryCreateLobby();
        if (response.ok) {
            let lobbyCode = await response.text();
            if (!this.tryOpenWebSocket(this.state.createLobbyName, lobbyCode)) {
                this.setState({createLobbyError:"There was an error connecting to the server. Please try again."})
            }
        } else {
            this.setState({createLobbyError:"There was an error connecting to the server. Please try again."});
        }
    };

    /**
     * Attempts to request the server to create a new lobby and returns the response.
     * @return {Promise<Response>}
     */
    async tryCreateLobby() {
        return fetch(SERVER_ADDRESS_HTTP + NEW_LOBBY);
    }

    /**
     * Checks if the login is valid.
     * @param name the name of the user.
     * @param lobby the lobby code.
     * @return {Promise<Response>} The response from the server.
     */
    async tryLogin(name, lobby) {
        return await fetch(SERVER_ADDRESS_HTTP + CHECK_LOGIN + "?name=" + name + "&lobby=" + lobby);
    }

    /**
     * Attempts to open a WebSocket with the server.
     * @param name the name of the user to connect with.
     * @param lobby the lobby to connect with.
     * @effects If a connection was successfully established, sets the state with the {@code name}, {@code lobby},
     *          and {@code ws} parameters. The WebSocket has a message callback to this.onWebSocketMessage().
     * @return {boolean} true if the connection was opened successfully. Otherwise, returns false.
     */
    tryOpenWebSocket(name, lobby) {
        let ws = new WebSocket('ws://' + SERVER_ADDRESS + WEBSOCKET + "?name=" + name + "&lobby=" + lobby);
        if (ws.OPEN) {
            this.setState({
                page: PAGE.LOBBY,
                websocket: ws,
                name: this.state.joinName,
                lobby: this.state.joinLobby
            });
            ws.onmessage = msg => this.onWebSocketMessage(msg);
            ws.onclose = () => this.tryOpenWebSocket(name, lobby); //TODO: Maybe change this to another method?
            return true;
        } else {
            return false;
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
                        label={"Your Name"}
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
                        label={"Your Name"}
                        onChange={this.updateCreateLobbyName}
                        value={this.state.createLobbyName}
                        maxLength={12}
                    />
                    <h6>{this.state.createLobbyError}</h6>
                    <button
                        onClick={this.onClickCreateLobby}
                        disabled={!this.shouldCreateLobbyButtonBeEnabled()}
                    >
                        CREATE LOBBY
                    </button>
                </div>
        </div>
        );
    }

    //</editor-fold>

    /////////////////// Lobby Page
    //<editor-fold desc="Lobby Page">

    renderLobbyPage() {
        return (
            <div className="App">
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>
                <div style={{textAlign:"left", marginLeft:"15px"}}>
                    <div style={{display:"flex", flexDirection:"row"}}>
                        <h2>Lobby Code: </h2>
                        <h2 style={{marginLeft:"5px"}}>{this.state.lobby}</h2>
                    </div>
                </div>
            </div>
        )
    }

    //</editor-fold>

    render() {
        switch (this.state.page) {
            case PAGE.LOGIN:
                return this.renderLoginPage();
            case PAGE.LOBBY:
                return this.renderLobbyPage();
                break;
            case PAGE.GAME:
                break;
        }
    }
}

export default App;
