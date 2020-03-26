import React, {Component} from 'react';
import './App.css';
import MaxLengthTextField from "./MaxLengthTextField";

import PolicyBack from "./assets/board-policy.png";
import PolicyLiberal from "./assets/board-policy-liberal.png";
import PolicyFascist from "./assets/board-policy-fascist.png";
import LiberalBoard from "./assets/board-liberal.png";
import FascistBoard56 from "./assets/board-fascist-5-6.png";
import ElectionTracker from "./assets/board-tracker.png";

import DrawDeck from "./assets/board-draw.png";
import DiscardDeck from "./assets/board-discard.png";


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
const MAX_FAILED_CONNECTIONS = 3;
const LOBBY_CODE_LENGTH = 6;

//////// Game Constants
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;

//////// JSON Packet Data

// Commands
//<editor-fold desc="Commands">
const PARAM_COMMAND = "command";
const PARAM_NAME = "name";
const PARAM_LOBBY = "lobby";

const COMMAND_PING = "ping";
const COMMAND_START_GAME = "start-game";
const COMMAND_GET_STATE = "get-state";
const COMMAND_NOMINATE_CHANCELLOR = "nominate-chancellor";
const COMMAND_REGISTER_VOTE = "register-vote";
const COMMAND_REGISTER_PRESIDENT_CHOICE = "register-president-choice";
const COMMAND_REGISTER_CHANCELLOR_CHOICE = "register-chancellor-choice";
const COMMAND_REGISTER_CHANCELLOR_VETO = "chancellor-veto";
const COMMAND_REGISTER_PRESIDENT_VETO = "president-veto";
const COMMAND_REGISTER_EXECUTION = "register-execution";
const COMMAND_REGISTER_SPECIAL_ELECTION = "register-special-election";
const COMMAND_GET_INVESTIGATION = "get-investigation";
const COMMAND_GET_PEEK = "get-peek";
const COMMAND_END_TERM = "end-term";

//</editor-fold>

// Params
// <editor-fold desc="Params">
const PARAM_IN_GAME = "in-game";

const PARAM_USER_COUNT = "user-count";
const PARAM_USERNAMES = "usernames";

const PARAM_STATE = "state";
const PARAM_PLAYERS = "players";
const PLAYER_NAME = "username";
const PLAYER_IDENTITY = "identity";
const PLAYER_IS_ALIVE = "alive";
const PLAYER_INVESTIGATED = "investigated";

// </editor-fold>

class App extends Component {

    websocket = undefined;
    failedConnections = 0;
    reconnectOnConnectionClosed = true;

    constructor(props) {
        super(props);
        this.state={
            page:PAGE.GAME,
            joinName:"",
            joinLobby:"",
            joinError:"",
            createLobbyName:"",
            createLobbyError:"",
            name:"",
            lobby:"AAAAAA",

            usernames:[],
            userCount:1,

            drawDeckSize: 17,
            discardDeckSize: 0,

            snackbarMessage:""
        };
        this.onWebSocketClose = this.onWebSocketClose.bind(this);
        this.tryOpenWebSocket = this.tryOpenWebSocket.bind(this);
        this.onClickLeaveLobby = this.onClickLeaveLobby.bind(this);
        this.onClickCopy = this.onClickCopy.bind(this);
        this.onClickStartGame = this.onClickStartGame.bind(this);
        this.sendWSCommand = this.sendWSCommand.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    /////////// Contacting Server
    // <editor-fold desc="Contacting Server">

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
        console.log("Failed connections: " + this.failedConnections);
        let ws = new WebSocket('ws://' + SERVER_ADDRESS + WEBSOCKET + "?name=" + encodeURIComponent(name) + "&lobby=" + encodeURIComponent(lobby));
        if (ws.OPEN) {
            this.websocket = ws;
            this.reconnectOnConnectionClosed = true;
            this.failedConnections = 0;
            this.setState({
                page: PAGE.LOBBY,
                name: name,
                lobby: lobby,
                joinName:"",
                joinLobby:"",
                joinError:"",
                createLobbyName:"",
                createLobbyError:""
            });
            ws.onmessage = msg => this.onWebSocketMessage(msg);
            ws.onclose = () => this.onWebSocketClose();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Called when the websocket closes.
     * @effects attempts to reopen the websocket connection.
     *          If the user pressed the "Leave Lobby" button or a maximum number of attempts has been reached
     *          ({@code MAX_FAILED_CONNECTIONS}), does not reopen the websocket connection and returns the user to the
     *          login screen with a relevant error message.
     */
    onWebSocketClose() {
        if (this.failedConnections < MAX_FAILED_CONNECTIONS && this.reconnectOnConnectionClosed) {
            this.failedConnections += 1;
            this.tryOpenWebSocket(this.state.name, this.state.lobby);
        } else if (this.reconnectOnConnectionClosed) {
            this.setState({
                page: PAGE.LOGIN,
                joinName: this.state.name,
                joinLobby: this.state.lobby,
                joinError: "Disconnected from the lobby."
            });
        } else { // User purposefully closed the connection.
            this.setState({
                page: PAGE.LOGIN,
                joinName: this.state.name,
                joinError: ""
            });
        }
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
     * Sends a specified command to the server.
     * @param command the String command label.
     * @param params a dictionary of any parameters that need to be provided with the command.
     * @effects sends a message to the server with the following parameters:
     *          {@code PARAM_COMMAND}: {@code command}
     *          {@code PARAM_LOBBY}: {@code this.state.lobby}
     *          {@code PARAM_NAME}: {@code this.state.name}
     *          and each (key, value) pair in {@code params}.
     */
    sendWSCommand(command, params) {
        let data = {};
        data["name"] = this.state.name;
        data["lobby"] = this.state.lobby;
        data[PARAM_COMMAND] = command;

        if (params !== undefined) {
            for (let key in params) {
                if (!data.hasOwnProperty(key)) { data[key] = params[key]; }
            }
        }

        this.websocket.send(JSON.stringify(data));
    }



    //</editor-fold>

    /////////////////// Login Page
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
                    if (!this.tryOpenWebSocket(encodeURIComponent(this.state.createLobbyName), lobbyCode)) { // if the connection failed
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
        this.sendWSCommand(COMMAND_START_GAME);
    }

    onClickLeaveLobby() {
        this.websocket.close();
        this.reconnectOnConnectionClosed = false;
    }

    onClickCopy() {
        let text = document.getElementById("linkText");
        text.select();
        text.setSelectionRange(0, 999999);
        document.execCommand("copy");
        this.setState({snackbarMessage: "Copied!"});
        let snackbar = document.getElementById("snackbar");
        snackbar.className = "show";
        setTimeout(() => {snackbar.className = snackbar.className.replace("show", "");}, 3000);
    }

    renderLobbyPage() {
        return (
            <div className="App">
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>

                <div style={{textAlign:"left", marginLeft:"20px", marginRight:"20px"}}>

                    <div style={{display:"flex", flexDirection:"row"}}>
                        <h2>LOBBY CODE: </h2>
                        <h2 style={{marginLeft:"5px", color:"var(--textColorHighlight)"}}>{this.state.lobby}</h2>
                    </div>


                    <p style={{marginBottom:"2px"}}>Copy and share this link to invite other players.</p>
                    <div style={{textAlign:"left", display:"flex", flexDirection:"row", alignItems:"center"}}>
                        <textarea id="linkText" readOnly={true} value={"secret-hitler-web.heroku.com/join/" + this.state.lobby}/>
                        <button
                            onClick={this.onClickCopy}
                        >
                            COPY
                        </button>
                    </div>


                    <div style={{display:"flex", flexDirection:"row", width:"90vw"}}>
                        <div style={{textAlign:"left", width:"50vw"}}>
                            <p>Players ({this.state.userCount}/10)</p>
                            {this.renderPlayerList()}
                        </div>

                        <div style={{display:"flex", flexDirection:"column", alignItems:"right"}}>
                            <button
                                onClick={this.onClickStartGame}
                                disabled={!this.shouldStartGameBeEnabled()}
                            >START GAME</button>
                            <button
                                onClick={this.onClickLeaveLobby}
                            >
                                LEAVE LOBBY
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{textAlign:"center"}}>
                    <div id="snackbar">{this.state.snackbarMessage}</div>
                </div>
            </div>
        )
    }

    //</editor-fold>

    /////////////////// Game Page


    /**
     * Renders the game page.
     */
    renderGamePage() {

        return (
            <div className="App" style={{textAlign:"center"}}>
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>

                <div style={{display:"inline-block"}}>
                    <div id={"Board Layout"} style={{alignItems:"center", display:"flex", flexDirection:"row", margin:"0 auto"}}>
                        <div id={"Draw Deck"}>
                            <img src={DrawDeck} style={{width:"11vmin"}} alt={"The draw deck. (" + this.state.drawDeckSize + " cards)"}/>
                        </div>

                        <div style={{display:"flex", flexDirection:"column", position:"relative"}}>
                            <img src={LiberalBoard} style={{width:"70vmin", margin:"4px 10px"}}/>
                            <img src={FascistBoard56} style={{width:"70vmin", margin:"4px 10px"}}/>
                            <img src={ElectionTracker} style={{position:"absolute", top:"36.5%", left:"calc(34.5% + 8.86% + 8.86% + 8.86%)", width:"2.5vmin"}} />
                        </div>

                        <div id={"Discard Deck"}>
                            <img src={DiscardDeck} style={{width:"11vmin"}} alt={"The discard deck. (" + this.state.discardDeckSize + " cards)"}/>
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    render() {
        switch (this.state.page) {
            case PAGE.LOGIN:
                return this.renderLoginPage();
                break;
            case PAGE.LOBBY:
                return this.renderLobbyPage();
                break;
            case PAGE.GAME:
                return this.renderGamePage();
                break;
        }
    }
}

export default App;
