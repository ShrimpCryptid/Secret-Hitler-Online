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

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;

//////// JSON Packet Data
const PARAM_IN_GAME = "in-game";

const PARAM_USER_COUNT = "user-count";
const PARAM_USERNAMES = "usernames";

const PARAM_STATE = "state";
const PARAM_PLAYERS = "players";
const PLAYER_NAME = "username";
const PLAYER_IDENTITY = "identity";
const PLAYER_IS_ALIVE = "alive";
const PLAYER_INVESTIGATED = "investigated";

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
            name:"",
            lobby:"AAAAAA",
            websocket:null,

            usernames:[],
            userCount:1
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    async onWebSocketMessage(msg) {
        console.log(msg.data);
        let message = JSON.parse(msg.data);
        if (message.hasOwnProperty(PARAM_IN_GAME) && !message[PARAM_IN_GAME]) {
            console.log("Not in game. Unpacking message contents...");
            if (message.hasOwnProperty(PARAM_USER_COUNT) && message.hasOwnProperty(PARAM_USERNAMES)) {
                this.setState({
                    userCount:message[PARAM_USER_COUNT],
                    usernames:message[PARAM_USERNAMES]
                });
            } else {
                console.log("Some data missing from lobby packet.");
            }
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
        return await fetch(SERVER_ADDRESS_HTTP + CHECK_LOGIN + "?name=" + encodeURIComponent(name)
                            + "&lobby=" + encodeURIComponent(lobby));
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
        console.log("Opening connection with lobby: " + lobby);
        let ws = new WebSocket('ws://' + SERVER_ADDRESS + WEBSOCKET + "?name=" + encodeURIComponent(name) + "&lobby=" + encodeURIComponent(lobby));
        if (ws.OPEN) {
            this.setState({
                page: PAGE.LOBBY,
                websocket: ws,
                name: name,
                lobby: lobby,
                joinName:"",
                joinLobby:"",
                joinError:"",
                createLobbyName:"",
                createLobbyError:""
            });
            ws.onmessage = msg => this.onWebSocketMessage(msg);
            ws.onclose = () => {this.setState({
                page:PAGE.LOGIN,
                joinName:name,
                joinLobby:lobby,
                joinError:"Disconnected from the lobby."
            })};
            return true;
        } else {
            return false;
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
    onClickJoin = () => {
        this.setState({joinError:"Connecting..."});
        this.tryLogin(this.state.joinName, this.state.joinLobby)
            .then(response => {
                if (!response.ok) {
                    console.log("Response is not ok");
                    if (response.status === 404) {
                        this.setState({joinError:"The lobby could not be found."});
                    } else if (response.status === 403) {
                        this.setState({joinError:"There is already a user with the name '" + this.state.joinName + "' in the lobby."});
                    } else if (response.status === 488) {
                        this.setState({joinError:"The lobby is currently in a game."});
                    } else if (response.status === 489) {
                        this.setState({joinError:"The lobby is currently full."})
                    } else {
                        this.setState({joinError:"There was an error connecting to the server. Please try again."});
                    }
                } else {
                    // Username and lobby were verified. Try to open websocket.
                    if (!this.tryOpenWebSocket(this.state.joinName, this.state.joinLobby)){
                        this.setState({joinError:"There was an error connecting to the server. Please try again."});
                    }
                }
            })
            .catch((error) => {
                this.setState({joinError:"There was an error contacting to the server. Please wait and try again."});
            });
    };

    /**
     * Attempts to connect to the server and create a new lobby, and then opens a connection to the lobby.
     */
    onClickCreateLobby = () => {
        this.setState({createLobbyError:"Connecting..."});
        this.tryCreateLobby().then(response => {
            if (response.ok) {
                response.text().then(lobbyCode => {
                    if (!this.tryOpenWebSocket(encodeURIComponent(this.state.createLobbyName), lobbyCode)) {
                        this.setState({createLobbyError:"There was an error connecting to the server. Please try again."})
                    }
                });
            } else {
                this.setState({createLobbyError:"There was an error connecting to the server. Please try again."});
            }
        })
        .catch(error => {
            this.setState({createLobbyError:"There was an error connecting to the server. Please try again."});
        });
    };

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

    /**
     * Renders the playerlist as a sequence of paragraph tags.
     * Written as "{@literal <p>} - {@code username} {@literal </p>}".
     */
    renderPlayerList() {
        console.log("Lobby: " + this.state.lobby);
        let out = [];
        let i = 0;
        for (i; i < this.state.userCount; i++) {
            let name = this.state.usernames[i];
            if(name === this.state.name) {
                name += " (you)";
            }
            out[i] = <p style={{marginBottom:"0px", marginTop:"2px"}}>{" - " + name}</p>;
        }
        return out;
    }

    /**
     * Determines whether the 'Start Game' button in the lobby should be enabled.
     */
    shouldStartGameBeEnabled() {
        return (this.state.userCount >= MIN_PLAYERS) && (this.state.userCount <= MAX_PLAYERS)
    }

    /**
     * Contacts the server and requests to start the game.
     */
    onClickStartGame() {

    }

    renderLobbyPage() {
        return (
            <div className="App">
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>
                <div style={{textAlign:"left", marginLeft:"20px"}}>
                    <div style={{display:"flex", flexDirection:"row"}}>
                        <h2>LOBBY CODE: </h2>
                        <h2 style={{marginLeft:"5px", color:"var(--textColorHighlight)"}}>{this.state.lobby}</h2>
                    </div>
                    <p style={{marginBottom:"2px"}}>Copy and share this link to invite other players.</p>
                    <div style={{textAlign:"left", display:"flex", flexDirection:"row", alignItems:"center"}}>
                        <textarea>{"secret-hitler-web.heroku.com/join/" + this.state.lobby}</textarea>
                        <button>COPY</button>
                    </div>

                    <div style={{display:"flex", flexDirection:"row", width:"100vw"}}>
                        <div style={{textAlign:"left", width:"50vw"}}>
                            <p>Players ({this.state.userCount}/10)</p>
                            <p>{this.renderPlayerList()}</p>
                        </div>
                        <div style={{display:"flex", flexDirection:"column", alignItems:"right"}}>
                            <button
                                disabled={!this.shouldStartGameBeEnabled()}
                            >START GAME</button>
                            <button>LEAVE LOBBY</button>
                        </div>
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
                break;
            case PAGE.LOBBY:
                return this.renderLobbyPage();
                break;
            case PAGE.GAME:
                break;
        }
    }
}

export default App;
