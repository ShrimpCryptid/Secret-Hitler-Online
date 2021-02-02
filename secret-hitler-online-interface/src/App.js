import React, {Component} from 'react';
import ReactGA from 'react-ga';
import './App.css';
import './Lobby.css';
import './fonts.css';
import MaxLengthTextField from "./util/MaxLengthTextField";
import CustomAlert from "./custom-alert/CustomAlert";
import RoleAlert from "./custom-alert/RoleAlert";
import EventBar from "./event-bar/EventBar";

import {
    PAGE,
    MAX_FAILED_CONNECTIONS,
    SERVER_ADDRESS_HTTP,
    NEW_LOBBY,
    CHECK_LOGIN,
    SERVER_ADDRESS,
    WEBSOCKET,
    PARAM_USER_COUNT,
    PARAM_USERNAMES,
    PARAM_COMMAND,
    LOBBY_CODE_LENGTH,
    MAX_PLAYERS,
    MIN_PLAYERS,
    COMMAND_START_GAME,
    PARAM_PLAYERS,
    PLAYER_IDENTITY,
    PARAM_PLAYER_ORDER,
    PARAM_STATE,
    STATE_CHANCELLOR_NOMINATION,
    PARAM_ELECTION_TRACKER,
    PARAM_LIBERAL_POLICIES,
    PARAM_FASCIST_POLICIES,
    STATE_CHANCELLOR_VOTING,
    PARAM_PRESIDENT,
    STATE_LEGISLATIVE_PRESIDENT,
    STATE_LEGISLATIVE_CHANCELLOR,
    PARAM_PACKET_TYPE,
    PACKET_LOBBY,
    PACKET_GAME_STATE,
    PACKET_INVESTIGATION,
    PACKET_OK,
    STATE_SETUP,
    PARAM_VOTES,
    FASCIST,
    LIBERAL,
    PARAM_CHANCELLOR,
    PARAM_PRESIDENT_CHOICES,
    STATE_POST_LEGISLATIVE,
    PARAM_CHANCELLOR_CHOICES,
    STATE_LEGISLATIVE_PRESIDENT_VETO,
    STATE_PP_INVESTIGATE,
    STATE_PP_EXECUTION,
    STATE_PP_ELECTION,
    PARAM_ELEC_TRACKER_ADVANCED,
    COMMAND_END_TERM,
    PARAM_LAST_STATE,
    STATE_PP_PEEK,
    PLAYER_IS_ALIVE,
    PARAM_TARGET,
    STATE_FASCIST_VICTORY_ELECTION,
    STATE_FASCIST_VICTORY_POLICY,
    STATE_LIBERAL_VICTORY_EXECUTION,
    STATE_LIBERAL_VICTORY_POLICY,
    PARAM_PEEK,
    PARAM_INVESTIGATION,
    HITLER,
    PARAM_DRAW_DECK,
    PARAM_DISCARD_DECK,
    WEBSOCKET_HEADER,
    DEBUG,
    PACKET_PONG,
    PING_INTERVAL, COMMAND_PING, SERVER_PING, PARAM_ICON
} from "./GlobalDefinitions";

import PlayerDisplay, {
    DISABLE_EXECUTED_PLAYERS,
    DISABLE_NONE,
} from "./player/PlayerDisplay";
import StatusBar from "./status-bar/StatusBar";
import Board from "./board/Board";
import VotingPrompt from "./custom-alert/VotingPrompt";
import PresidentLegislativePrompt from "./custom-alert/PresidentLegislativePrompt";
import ChancellorLegislativePrompt from "./custom-alert/ChancellorLegislativePrompt";
import VetoPrompt from "./custom-alert/VetoPrompt";
import ElectionTrackerAlert from "./custom-alert/ElectionTrackerAlert";
import PolicyEnactedAlert from "./custom-alert/PolicyEnactedAlert";
import {
    SelectExecutionPrompt,
    SelectInvestigationPrompt,
    SelectNominationPrompt, SelectSpecialElectionPrompt
} from "./custom-alert/SelectPlayerPrompt";
import ButtonPrompt from "./custom-alert/ButtonPrompt";
import PeekPrompt from "./custom-alert/PeekPrompt";
import InvestigationAlert from "./custom-alert/InvestigationAlert";
import Deck from "./board/Deck";
import PlayerPolicyStatus from "./util/PlayerPolicyStatus";

import VictoryFascistHeader from "./assets/victory-fascist-header.png";
import VictoryFascistFooter from "./assets/victory-fascist-footer.png";
import VictoryLiberalHeader from "./assets/victory-liberal-header.png";
import VictoryLiberalFooter from "./assets/victory-liberal-footer.png";
import IconSelection from "./custom-alert/IconSelection";
import HelmetMetaData from "./util/HelmetMetaData";
import {defaultPortrait} from "./assets";
import PropTypes from "prop-types";
import Player from "./player/Player";
import LoginPageContent from "./LoginPageContent";

const EVENT_BAR_FADE_OUT_DURATION = 500;
const CUSTOM_ALERT_FADE_DURATION = 1000;

const DEFAULT_GAME_STATE = {
    "liberal-policies": 0,
    "fascist-policies": 0,
    "discard-size": 0,
    "draw-size": 17,
    "players": {},
    "in-game": true,
    "player-order": [],
    "state": STATE_SETUP,
    "president": "",
    "chancellor": "",
    "election-tracker": 0
};
const TEST_GAME_STATE = {
    "liberal-policies": 0,
    "fascist-policies": 0,
    "discard-size": 0,
    "draw-size": 17,
    "players": {
        "P1": {"alive": true, "id": "FASCIST", "investigated": false},
        "P2": {"alive": true, "id": "HITLER", "investigated": false},
        "P3": {"alive": true, "id": "LIBERAL", "investigated": true},
        "P4": {"alive": true, "id": "LIBERAL", "investigated": false},
        "P5": {"alive": true, "id": "LIBERAL", "investigated": false},
        "P6": {"alive": false, "id": "FASCIST", "investigated": false},
        "P7": {"alive": true, "id": "LIBERAL", "investigated": false}
    },
    "in-game": true,
    "player-order": ["P4", "P2", "P6", "P1", "P7", "P3", "P5"],
    "state": STATE_SETUP,
    "last-president": "P7",
    "last-chancellor": "P3",
    "president": "P4",
    "chancellor": "P5",
    "election-tracker": 0,
    "user-votes": {"P4": true, "P2": false, "P1": false, "P7": true, "P3": false, "P5": true},
    "icon": {
        "P1": "p5",
        "P2": "p9",
        "P3": "p8",
        "P4": "p15",
        "P5": "p_default",
        "P6": "p4",
        "P7": "p2"
    }
};

class App extends Component {

    websocket = undefined;
    failedConnections = 0;
    pinginterval = undefined;
    reconnectOnConnectionClosed = true;
    snackbarMessages = 0;
    animationQueue = [];
    okMessageListeners = [];
    allAnimationsFinished = true;
    gameOver = false;

    // noinspection DuplicatedCode
    constructor(props) {
        super(props);
        this.state = {
            page: PAGE.LOGIN,

            joinName: "",
            joinLobby: "",
            joinError: "",
            createLobbyName: "",
            createLobbyError: "",
            name: "P1",
            lobby: "AAAAAA",
            lobbyFromURL: false,

            usernames: [],
            userCount: 0,
            icons: {},

            gameState: DEFAULT_GAME_STATE,
            lastState: {}, /* Stores the last gameState[PARAM_STATE] value to check for changes. */
            liberalPolicies: 0,
            fascistPolicies: 0,
            electionTracker: 0, /*The position of the election tracker, ranging from 0 to 3.*/
            showVotes: false,
            drawDeckSize: 17,
            discardDeckSize: 0,

            snackbarMessage: "",

            showAlert: false,
            alertContent: <div/>,

            showEventBar: false,
            eventBarMessage: "",

            statusBarText: "---",
            allAnimationsFinished: true,
        };

        // The website uses Google Analytics!
        ReactGA.initialize("UA-166327773-1");
        ReactGA.pageview("/");

        // These are necessary for handling class fields (ex: websocket)
        this.onWebSocketClose = this.onWebSocketClose.bind(this);
        this.tryOpenWebSocket = this.tryOpenWebSocket.bind(this);
        this.onClickLeaveLobby = this.onClickLeaveLobby.bind(this);
        this.onClickCopy = this.onClickCopy.bind(this);
        this.onClickStartGame = this.onClickStartGame.bind(this);
        this.sendWSCommand = this.sendWSCommand.bind(this);
        this.playAnimationTest = this.playAnimationTest.bind(this);
        this.showSnackBar = this.showSnackBar.bind(this);
        this.onAnimationFinish = this.onAnimationFinish.bind(this);
        this.onGameStateChanged = this.onGameStateChanged.bind(this);
        this.hideAlertAndFinish = this.hideAlertAndFinish.bind(this);
        this.addAnimationToQueue = this.addAnimationToQueue.bind(this);
        this.clearAnimationQueue = this.clearAnimationQueue.bind(this);
        this.queueAlert = this.queueAlert.bind(this);
        this.showChangeIconAlert = this.showChangeIconAlert.bind(this);
        this.updateChangeIconAlert = this.updateChangeIconAlert.bind(this);
        this.onClickChangeIcon = this.onClickChangeIcon.bind(this);

        // Ping the server to wake it up if it's not currently being used
        // This reduces the delay users experience when starting lobbies
        fetch(SERVER_ADDRESS_HTTP + SERVER_PING);
    }

    /////////// Server Communication
    // <editor-fold desc="Server Communication">

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
        ReactGA.event({
            category: "Login Attempt",
            action: "User attempted to provide login credentials to the server.",
        });
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
        if (DEBUG) {
            console.log("Opening connection with lobby: " + lobby);
            console.log("Failed connections: " + this.failedConnections);
        }
        let ws = new WebSocket(WEBSOCKET_HEADER + SERVER_ADDRESS + WEBSOCKET + "?name=" + encodeURIComponent(name) + "&lobby=" + encodeURIComponent(lobby));
        if (ws.OPEN) {
            this.websocket = ws;
            this.reconnectOnConnectionClosed = true;
            // Only move the player to the lobby page if they were logging in.
            // This is to prevent the bug where players flash in/out of the lobby page
            // at random points in the game.
            if (this.state.page === PAGE.LOGIN) {
                this.setState({page: PAGE.LOBBY});
            }
            this.setState({
                name: name,
                lobby: lobby,
                usernames: [],
                userCount: 0,
                joinName: "",
                joinLobby: "",
                joinError: "",
                createLobbyName: "",
                createLobbyError: ""
            });
            ws.onmessage = msg => this.onWebSocketMessage(msg);
            ws.onclose = () => this.onWebSocketClose();
            // Ping the web server at a set interval.
            this.pinginterval = setInterval(() => {
                this.sendWSCommand(COMMAND_PING, {})
            }, PING_INTERVAL);
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
        // Clear the server ping interval each time the socket is closed.
        if (this.pinginterval) {
            clearInterval(this.pinginterval);
        }

        if (this.reconnectOnConnectionClosed && this.failedConnections < MAX_FAILED_CONNECTIONS) {
            if (this.failedConnections >= 1) {  // Only show the error bar if the first attempt has failed.
                this.showSnackBar("Lost connection to the server: retrying...");
                ReactGA.event({
                    category: "Lost Server Connection",
                    action: "User lost connection to the server. (>1 attempts)"
                });
            }
            this.failedConnections += 1;
            this.tryOpenWebSocket(this.state.name, this.state.lobby);
        } else if (this.reconnectOnConnectionClosed) {
            if (DEBUG) {console.log("Disconnecting from lobby.")}
            this.setState({
                joinName: this.state.name,
                joinLobby: this.state.lobby,
                joinError: "Disconnected from the lobby.",
                page: PAGE.LOGIN,
            });
            ReactGA.event({
                category: "Lost Server Connection (Terminal)",
                action: "User was unable to reconnect to the server. (max attempts reached)"
            });
            this.clearAnimationQueue();
        } else { // User purposefully closed the connection.
            if (this.gameOver) {
                // Do not reopen if the game is over, since disconnecting is intentional.
            } else {
                this.setState({
                    page: PAGE.LOGIN,
                    joinName: decodeURIComponent(this.state.name),
                    joinLobby: this.state.lobby,
                    joinError: ""
                });
                this.clearAnimationQueue();
            }
        }
    }


    async onWebSocketMessage(msg) {
        if (DEBUG) {
            console.log(msg.data);
        }
        this.failedConnections = 0;
        let message = JSON.parse(msg.data);

        switch (message[PARAM_PACKET_TYPE]) {
            case PACKET_LOBBY:
                this.setState({
                    userCount: message[PARAM_USER_COUNT],
                    usernames: message[PARAM_USERNAMES],
                    icons: message[PARAM_ICON],
                    page: PAGE.LOBBY
                });
                if (message[PARAM_ICON][this.state.name] === defaultPortrait) {
                    this.showChangeIconAlert();
                }
                this.updateChangeIconAlert();
                break;

            case PACKET_GAME_STATE:
                if (message !== this.state.gameState) {
                    this.onGameStateChanged(message);
                }
                this.setState({gameState: message, page: PAGE.GAME});
                break;

            case PACKET_OK: // Traverse all listeners and call the functions.
                let i = 0;
                for (i; i < this.okMessageListeners.length && i < 1; i++) {
                    this.okMessageListeners[i]();
                }
                this.okMessageListeners = []; // clear all listeners.
                break;

            case PACKET_INVESTIGATION:

                break;
            case PACKET_PONG:
            default:
            // No action
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
                if (!data.hasOwnProperty(key)) {
                    data[key] = params[key];
                }
            }
        }

        if (DEBUG) {
            console.log(JSON.stringify(data));
        }
        if (this.websocket !== undefined) {
            this.websocket.send(JSON.stringify(data));
        } else {
            this.showSnackBar("Could not connect to the server. Try refreshing the page if this happens again.");
        }
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
            joinName: text
        });
    };

    /**
     * Updates the Lobby field under Join Game.
     * @param text the text to update the text field to.
     */
    updateJoinLobby = (text) => {
        this.setState({
            joinLobby: text
        });
    };

    /**
     * Updates the Name field under Create Lobby.
     * @param text the text to update the text field to.
     */
    updateCreateLobbyName = (text) => {
        this.setState({
            createLobbyName: text
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
        this.setState({joinError: "Connecting..."});
        this.tryLogin(this.state.joinName, this.state.joinLobby)
            .then(response => {
                if (!response.ok) {
                    if (DEBUG) {
                        console.log("Response is not ok");
                    }
                    if (response.status === 404) {
                        this.setState({joinError: "The lobby could not be found."});
                        ReactGA.event({
                            category: "Login Failed",
                            action: "Lobby not found - User unable to connect."
                        });
                    } else if (response.status === 403) {
                        this.setState({joinError: "There is already a user with the name '" + this.state.joinName + "' in the lobby."});
                        ReactGA.event({
                            category: "Login Failed",
                            action: "Duplicate name - User unable to connect."
                        });
                    } else if (response.status === 488) {
                        this.setState({joinError: "The lobby is currently in a game."});
                        ReactGA.event({
                            category: "Login Failed",
                            action: "Ongoing game - User unable to connect."
                        });
                    } else if (response.status === 489) {
                        this.setState({joinError: "The lobby is currently full."})
                        ReactGA.event({
                            category: "Login Failed",
                            action: "Lobby full - User unable to connect."
                        });
                    } else {
                        this.setState({joinError: "There was an error connecting to the server. Please try again."});
                        ReactGA.event({
                            category: "Login Failed",
                            action: "Misc - User was unable to connect."
                        });
                    }
                } else {
                    // Username and lobby were verified. Try to open websocket.
                    if (!this.tryOpenWebSocket(this.state.joinName, this.state.joinLobby)) {
                        this.setState({joinError: "There was an error connecting to the server. Please try again."});
                    }
                }
            })
            .catch(() => {
                this.setState({joinError: "There was an error contacting the server. Please wait and try again."});
            });
    };

    /**
     * Attempts to connect to the server and create a new lobby, and then opens a connection to the lobby.
     */
    onClickCreateLobby = () => {
        this.setState({createLobbyError: "Connecting..."});
        this.tryCreateLobby().then(response => {
            if (response.ok) {
                response.text().then(lobbyCode => {
                    if (!this.tryOpenWebSocket(encodeURIComponent(this.state.createLobbyName), lobbyCode)) { // if the connection failed
                        this.setState({createLobbyError: "There was an error connecting to the server. Please try again."});
                        ReactGA.event({
                            category: "Lobby Creation Failed",
                            action: "Failed to create a new lobby.",
                        });
                    } else {
                        ReactGA.event({
                            category: "Lobby Created",
                            action: "Successfully created new lobby.",
                        });
                    }
                });
            } else {
                this.setState({createLobbyError: "There was an error connecting to the server. Please try again."});
                ReactGA.event({
                    category: "Lobby Creation Failed",
                    action: "Failed to create a new lobby.",
                });
            }
        })
            .catch(() => {
                this.setState({createLobbyError: "There was an error connecting to the server. Please try again."});
                ReactGA.event({
                    category: "Lobby Creation Failed",
                    action: "Failed to create a new lobby.",
                });
            });
    };


    renderLoginPage() {
        return (
            <div className="App">
                <header className="App-header">
                    SECRET-HITLER.ONLINE
                </header>
                <br/>
                <div style={{textAlign: "center"}}>
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
                    <p id={"errormessage"}>{this.state.joinError}</p>
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
                    <p id={"errormessage"}>{this.state.createLobbyError}</p>
                    <button
                        onClick={this.onClickCreateLobby}
                        disabled={!this.shouldCreateLobbyButtonBeEnabled()}
                    >
                        CREATE LOBBY
                    </button>
                </div>
                <br/>
                <LoginPageContent />
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
        if (DEBUG) {
            console.log("Lobby: " + this.state.lobby);
        }
        let out = [];
        let i = 0;
        for (i; i < this.state.userCount; i++) {
            let name = this.state.usernames[i];
            let displayName = name;
            if (i === 0) {
                displayName += " [★VIP]";
            }
            out[i] = <Player
                    name={displayName}
                    showRole={false}
                    icon={this.state.icons[name]}
                    isBusy={this.state.icons[name] === defaultPortrait}
                    highlight={name === this.state.name}
                />;
                //<p style={{marginBottom: "0px", marginTop: "2px"}}>{" - " + decodeURIComponent(name)}</p>;
        }
        return out;
    }

    onClickChangeIcon() {
        this.showChangeIconAlert();
    }

    updateChangeIconAlert() {
        this.setState({alertContent: <IconSelection
                onConfirm={() => {this.clearAnimationQueue(); this.hideAlertAndFinish();}}
                sendWSCommand={this.sendWSCommand}
                playerToIcon={this.state.icons}
                players={this.state.usernames}
                user={this.state.name}
                onClickTweet={()=> {ReactGA.event({category: "Sharing", action: "User shared tweet"})}}
            />}
        );
    }

    showChangeIconAlert() {
        this.queueAlert(<div/>, false); // false here prevents dialog from closing when server confirms selection
        this.updateChangeIconAlert();
    }

    /**
     * Determines whether the 'Start Game' button in the lobby should be enabled.
     */
    shouldStartGameBeEnabled() {
        // Verify that all players have icons
        for (let i = 0; i < this.state.usernames.length; i++) {
            if (this.state.icons[this.state.usernames[i]] === defaultPortrait) {
                return false;
            }
        }
        return (this.state.userCount >= MIN_PLAYERS) && (this.state.userCount <= MAX_PLAYERS);
    }

    /**
     * Contacts the server and requests to start the game.
     */
    onClickStartGame() {
        ReactGA.event({
            category: "Starting Game",
            action: this.state.userCount + " players started game."
        });
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
        this.showSnackBar("Copied!")
    }

    showSnackBar(message) {
        this.setState({snackbarMessage: message});
        let snackbar = document.getElementById("snackbar");
        snackbar.className = "show";
        this.snackbarMessages++;
        setTimeout(() => {
            this.snackbarMessages--;
            if (this.snackbarMessages === 0) {
                snackbar.className = snackbar.className.replace("show", "");
            }
        }, 3000);
    }

    renderLobbyPage() {
        // The first player in the lobby is counted as the VIP.
        let isVIP = (this.state.usernames.length > 0 && this.state.usernames[0] === this.state.name);
        let canStartGame;
        return (
            <div className="App">
                <header className="App-header">
                    SECRET-HITLER.ONLINE
                </header>

                <CustomAlert show={this.state.showAlert}>
                    {this.state.alertContent}
                </CustomAlert>

                <div style={{textAlign: "left", marginLeft: "20px", marginRight: "20px"}}>

                    <div style={{display: "flex", flexDirection: "row"}}>
                        <h2>LOBBY CODE: </h2>
                        <h2 style={{marginLeft: "5px", color: "var(--textColorHighlight)"}}>{this.state.lobby}</h2>
                    </div>


                    <p style={{marginBottom: "2px"}}>Copy and share this link to invite other players.</p>
                    <div style={{textAlign: "left", display: "flex", flexDirection: "row", alignItems: "center"}}>
                        <textarea id="linkText" readOnly={true}
                                  value={"https://secret-hitler.online/?lobby=" + this.state.lobby}/>
                        <button
                            onClick={this.onClickCopy}
                        >
                            COPY
                        </button>
                    </div>


                    <div id={"lobby-lower-container"}>
                        <div id={"lobby-player-area-container"}>
                            <div id={"lobby-player-text-choose-container"}>
                                <p id={"lobby-player-count-text"}>Players ({this.state.userCount}/10)</p>
                                <button id={"lobby-change-icon-button"} onClick={this.onClickChangeIcon}>CHANGE ICON</button>
                            </div>
                            <div id={"lobby-player-container"}>
                                {this.renderPlayerList()}
                            </div>
                        </div>

                        <div id={"lobby-button-container"}>
                            {!isVIP &&
                            <p id={"lobby-vip-text"}>Only the VIP can start the game.</p>
                            }
                            <button
                                onClick={this.onClickStartGame}
                                disabled={!isVIP || !this.shouldStartGameBeEnabled()}
                            >START GAME
                            </button>
                            <button
                                onClick={this.onClickLeaveLobby}
                            >
                                LEAVE LOBBY
                            </button>
                        </div>
                        <div id={"lobby-text-container"}>
                            <p id={"lobby-about-text"}>
                                <a href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/blob/master/README.md"}
                                   target={"_blank"} rel="noopener" onClick={this.onClickAbout}>
                                    About this project
                                </a>
                            </p>
                            <br/>
                            <p id={"lobby-warning-text"}>
                                You can report bugs on the <a
                                href={"https://github.com/ShrimpCryptid/Secret-Hitler-Online/issues"} rel="noopener" target={"_blank"}>Issues
                                page.</a>
                            </p>
                        </div>
                    </div>
                </div>
                <div style={{textAlign: "center"}}>
                    <div id="snackbar">{this.state.snackbarMessage}</div>
                </div>
            </div>
        )
    }

    //</editor-fold>

    /////////////////// Game Page
    //<editor-fold desc="Game Page">

    /**
     * Queues animations for when the game state has changed.
     * @param newState {Object} the new game state sent from the server.
     */
    onGameStateChanged(newState) {
        let oldState = this.state.gameState;
        let name = this.state.name;
        let isPresident = this.state.name === newState[PARAM_PRESIDENT];
        let isChancellor = this.state.name === newState[PARAM_CHANCELLOR];
        let state = newState[PARAM_STATE];

        // If last state was setup, which indicates that the client is re-entering the game or starting the game, then
        // we set the card count, liberal/fascist policy count, and the tracker to be visible.
        if (oldState.hasOwnProperty(PARAM_STATE) && oldState[PARAM_STATE] === STATE_SETUP) {
            this.setState({
                liberalPolicies: newState[PARAM_LIBERAL_POLICIES],
                fascistPolicies: newState[PARAM_FASCIST_POLICIES],
                electionTracker: newState[PARAM_ELECTION_TRACKER],
                drawDeckSize: newState[PARAM_DRAW_DECK],
                discardDeckSize: newState[PARAM_DISCARD_DECK],
            });
        }

        // Check for changes in enacted policies and election tracker.
        if (state === STATE_POST_LEGISLATIVE || state === STATE_PP_INVESTIGATE || state === STATE_PP_EXECUTION
            || state === STATE_PP_ELECTION || state === STATE_PP_PEEK) {

            // Check if the election tracker changed positions.
            if (newState[PARAM_ELECTION_TRACKER] !== this.state.gameState[PARAM_ELECTION_TRACKER]) {
                let newPos = newState[PARAM_ELECTION_TRACKER];
                let advancedToThree = newPos === 0 && newState[PARAM_ELEC_TRACKER_ADVANCED];
                // We ignore all resets to 0, unless that reset was caused by the election tracker reaching 3.
                if (newPos !== 0 || advancedToThree) {

                    // If the last phase was voting, we failed due to voting. Therefore, show votes.
                    if (oldState[PARAM_STATE] === STATE_CHANCELLOR_VOTING) {
                        //this.queueAlert(<RoleAlert onClick={this.hideAlertAndFinish} />);
                        this.addAnimationToQueue(() => this.showVotes(newState));
                    }

                    let trackerPosition = newPos;
                    if (advancedToThree) {
                        // If the tracker was reset because it advanced to 3, show it moving to 3 in the dialog box.
                        trackerPosition = 3;
                    }
                    this.queueAlert(
                        <ElectionTrackerAlert
                            trackerPosition={trackerPosition}
                            closeAlert={this.hideAlertAndFinish}/>
                    );
                }
            }

            let liberalChanged = newState[PARAM_LIBERAL_POLICIES] !== oldState[PARAM_LIBERAL_POLICIES];
            let fascistChanged = newState[PARAM_FASCIST_POLICIES] !== oldState[PARAM_FASCIST_POLICIES];

            if (liberalChanged || fascistChanged) {
                // Show an alert with the new policy
                this.queueAlert((
                    <PolicyEnactedAlert
                        hideAlert={this.hideAlertAndFinish}
                        policyType={liberalChanged ? LIBERAL : FASCIST}/>
                ));
            }


            // Update the decks, board with the new policies / election tracker.
            this.addAnimationToQueue(() => {
                this.setState({
                    liberalPolicies: newState[PARAM_LIBERAL_POLICIES],
                    fascistPolicies: newState[PARAM_FASCIST_POLICIES],
                    electionTracker: newState[PARAM_ELECTION_TRACKER],
                });
                setTimeout(() => this.onAnimationFinish(), 500);
            });
        }

        // Check for state change
        if (newState[PARAM_STATE] !== this.state.gameState[PARAM_STATE]) { // state has changed
            switch (newState[PARAM_STATE]) {
                case STATE_CHANCELLOR_NOMINATION:
                    if (newState[PARAM_ELECTION_TRACKER] === 0
                        && newState[PARAM_LIBERAL_POLICIES] === 0
                        && newState[PARAM_FASCIST_POLICIES] === 0) {
                        // If the game has just started (everything in default state), show the player's role.
                        this.queueAlert(
                            <RoleAlert
                                role={newState[PARAM_PLAYERS][this.state.name][PLAYER_IDENTITY]}
                                gameState={newState}
                                name={name}
                                onClick={() => {
                                    this.hideAlertAndFinish();
                                }}
                            />
                            , false);
                    }

                    this.queueEventUpdate("CHANCELLOR NOMINATION");
                    this.queueStatusMessage("Waiting for president to nominate a chancellor.");

                    if (isPresident) {
                        //Show the chancellor nomination window.
                        this.queueAlert(
                            SelectNominationPrompt(name, newState, this.sendWSCommand)
                        );
                    }

                    break;

                case STATE_CHANCELLOR_VOTING:
                    this.setState({statusBarText: ""});
                    this.queueEventUpdate("VOTING");
                    this.queueStatusMessage("Waiting for all players to vote.");
                    // Check if the player is dead or has already voted-- if so, do not show the voting prompt.
                    if (newState[PARAM_PLAYERS][name][PLAYER_IS_ALIVE] && !(name in newState[PARAM_VOTES])) {
                        this.queueAlert(
                            <VotingPrompt
                                gameState={newState}
                                sendWSCommand={this.sendWSCommand}
                                user={this.state.name}
                            />
                            , true
                        );
                    }

                    break;

                case STATE_LEGISLATIVE_PRESIDENT:
                    // The vote completed, so show the votes.
                    this.addAnimationToQueue(() => this.showVotes(newState));
                    this.queueEventUpdate("LEGISLATIVE SESSION");

                    // TODO: Animate cards being pulled from the draw deck for all users.

                    this.queueStatusMessage("Waiting for the president to choose a policy to discard.");

                    if (isPresident) {
                        this.queueAlert(
                            <PresidentLegislativePrompt
                                policyOptions={newState[PARAM_PRESIDENT_CHOICES]}
                                sendWSCommand={this.sendWSCommand}
                            />
                        );
                    }

                    break;

                case STATE_LEGISLATIVE_CHANCELLOR:
                    this.queueStatusMessage("Waiting for the chancellor to choose a policy to enact.");
                    if (isChancellor) {
                        this.queueAlert(
                            <ChancellorLegislativePrompt
                                fascistPolicies={newState[PARAM_FASCIST_POLICIES]}
                                showError={(message) => this.setState({snackbarMessage: message})}
                                policyOptions={newState[PARAM_CHANCELLOR_CHOICES]}
                                sendWSCommand={this.sendWSCommand}
                                enableVeto={newState[PARAM_FASCIST_POLICIES] === 5}
                            />
                        );
                    }
                    break;

                case STATE_LEGISLATIVE_PRESIDENT_VETO:
                    this.queueStatusMessage("Chancellor has motioned to veto the agenda. Waiting for the president to decide.");
                    if (isPresident) {
                        this.queueAlert(
                            <VetoPrompt
                                sendWSCommand={this.sendWSCommand}
                                electionTracker={newState[PARAM_ELECTION_TRACKER]}
                            />
                            , true)
                    }
                    break;

                case STATE_PP_PEEK:
                    this.queueEventUpdate("PRESIDENTIAL POWER");
                    if (isPresident) {
                        this.queueAlert(
                            <PeekPrompt
                                policies={newState[PARAM_PEEK]}
                                sendWSCommand={this.sendWSCommand}
                            />
                            , true);
                    } else {
                        this.queueStatusMessage("Peek: President is previewing the next 3 policies.");
                    }
                    break;

                case STATE_PP_ELECTION:
                    this.queueEventUpdate("PRESIDENTIAL POWER");
                    if (isPresident) {
                        this.queueAlert(SelectSpecialElectionPrompt(name, newState, this.sendWSCommand));
                    } else {
                        this.queueStatusMessage("Special Election: President is choosing the next president.");
                    }
                    break;

                case STATE_PP_EXECUTION:
                    this.queueEventUpdate("PRESIDENTIAL POWER");
                    if (isPresident) {
                        this.queueAlert(SelectExecutionPrompt(name, newState, this.sendWSCommand), true);
                    } else {
                        this.queueStatusMessage("Execution: President is choosing a player to execute.");
                    }
                    break;

                case STATE_PP_INVESTIGATE:
                    this.queueEventUpdate("PRESIDENTIAL POWER");
                    if (isPresident) {
                        this.queueAlert(SelectInvestigationPrompt(name, newState, this.sendWSCommand));
                    } else {
                        this.queueStatusMessage("Investigation: President is choosing a player to investigate.");
                    }
                    break;

                case STATE_POST_LEGISLATIVE:
                    switch (newState[PARAM_LAST_STATE]) {
                        case STATE_PP_ELECTION:
                            if (!isPresident) {
                                console.log("Special Election Alert: " + newState[PARAM_TARGET]);
                                this.queueAlert(
                                    <ButtonPrompt
                                        label={"SPECIAL ELECTION"}
                                        footerText={newState[PARAM_PRESIDENT] + " has chosen " + newState[PARAM_TARGET]
                                        + " to be the next president."
                                        + "\nThe normal presidential order will resume after the next round."}
                                        buttonText={"OKAY"}
                                        buttonOnClick={this.hideAlertAndFinish}
                                    >
                                        <PlayerDisplay
                                            user={name}
                                            gameState={newState}
                                            showLabels={false}
                                            players={[newState[PARAM_TARGET]]}
                                        />
                                    </ButtonPrompt>
                                    , false);
                            }
                            break;
                        case STATE_PP_EXECUTION:
                            // If player was executed
                            if (name === newState[PARAM_TARGET]) {
                                this.queueAlert(<ButtonPrompt
                                    label={"YOU HAVE BEEN EXECUTED"}
                                    headerText={"Executed players may not speak, vote, or run for office. You should not reveal your identity to the group."}
                                    buttonOnClick={this.hideAlertAndFinish}
                                />, false)
                            } else {
                                this.queueAlert(
                                    <ButtonPrompt
                                        label={"EXECUTION RESULTS"}
                                        footerText={newState[PARAM_TARGET] + " has been executed. They may no longer speak, vote, or run for office."}
                                        buttonOnClick={this.hideAlertAndFinish}
                                        buttonText={"OKAY"}
                                    >
                                        <PlayerDisplay
                                            user={name}
                                            gameState={newState}
                                            showRoles={false}
                                            playerDisabledFilter={DISABLE_EXECUTED_PLAYERS}
                                            players={[newState[PARAM_TARGET]]}
                                        />
                                    </ButtonPrompt>
                                    , false);
                            }
                            break;
                        case STATE_PP_INVESTIGATE:
                            if (!isPresident) {
                                let isTarget = newState[PARAM_TARGET] === name;
                                this.queueAlert(
                                    <ButtonPrompt
                                        label={"INVESTIGATION RESULTS"}
                                        // If target: You have been investigated by [President Name].
                                        //            The president now knows your party affiliation.
                                        // If not target: [Target Name] has been investigated by [President Name].
                                        //                The president now knows their party affiliation.
                                        footerText={(isTarget ? "You have " : newState[PARAM_TARGET] + " has ")
                                        + " been investigated by " + newState[PARAM_PRESIDENT] + ". "
                                        + "The president now knows " + (isTarget ? "your" : "their")
                                        + " party affiliation (Liberal/Fascist)."}
                                        buttonOnClick={this.hideAlertAndFinish}
                                        buttonText={"OKAY"}
                                    >
                                        <PlayerDisplay
                                            user={name}
                                            gameState={newState}
                                            showLabels={false}
                                            players={[newState[PARAM_TARGET]]}
                                        />
                                    </ButtonPrompt>
                                    , true);
                            } else {
                                // Is President
                                let target = newState[PARAM_TARGET];
                                // Set party according to liberal/fascist
                                let party = (newState[PARAM_PLAYERS][target][PLAYER_IDENTITY] === LIBERAL ? LIBERAL : FASCIST);

                                this.queueAlert(
                                    <InvestigationAlert party={party}
                                                        target={target}
                                                        hideAlert={this.hideAlertAndFinish}
                                    />
                                    , false);
                            }
                            break;
                        case STATE_PP_PEEK: // No additional case is necessary for peeking.
                        default:
                    }

                    this.queueStatusMessage("Waiting for the president to end their term.");
                    break;

                case STATE_FASCIST_VICTORY_ELECTION:
                case STATE_FASCIST_VICTORY_POLICY:
                case STATE_LIBERAL_VICTORY_EXECUTION:
                case STATE_LIBERAL_VICTORY_POLICY:
                    // If the game was won via election, show the votes.
                    if (newState[PARAM_STATE] === STATE_FASCIST_VICTORY_ELECTION) {
                        this.addAnimationToQueue(() => this.showVotes(newState));
                    }

                    // Divide fascist and liberal players.
                    let fascistPlayers = [];
                    let liberalPlayers = [];
                    newState[PARAM_PLAYER_ORDER].forEach(player => {
                        let role = newState[PARAM_PLAYERS][player][PLAYER_IDENTITY];
                        if (role === FASCIST || role === HITLER) {
                            fascistPlayers.push(player);
                        } else {
                            liberalPlayers.push(player);
                        }
                    });

                    let victoryMessage, messageClass, headerImage, headerAlt;
                    let players = [];
                    let state = newState[PARAM_STATE];
                    let fascistVictoryPolicy = state === STATE_FASCIST_VICTORY_POLICY;
                    let fascistVictoryElection = state === STATE_FASCIST_VICTORY_ELECTION;
                    let liberalVictoryPolicy = state === STATE_LIBERAL_VICTORY_POLICY;
                    let liberalVictoryExecution = state === STATE_LIBERAL_VICTORY_EXECUTION;
                    let playerID = newState[PARAM_PLAYERS][name][PLAYER_IDENTITY];
                    let playerWon =
                        (playerID === LIBERAL && (liberalVictoryExecution || liberalVictoryPolicy))
                        || (playerID !== LIBERAL && (fascistVictoryElection || fascistVictoryPolicy));

                    // Register player victory/loss with analytics.
                    if (playerWon) {
                        ReactGA.event({
                            category: "Victory",
                            action: playerID + " team won the game."
                        });
                    } else {
                        ReactGA.event({
                            category: "Loss",
                            action: playerID + " team lost the game."
                        });
                    }

                    if (fascistVictoryElection || fascistVictoryPolicy) {
                        players = fascistPlayers.concat(liberalPlayers);
                        headerImage = VictoryFascistHeader;
                        headerAlt = "Fascist Victory, written in red with a skull icon.";
                        messageClass = "highlight";
                        if (fascistVictoryPolicy) {
                            victoryMessage = "Fascists successfully passed six policies!"
                        } else if (fascistVictoryElection) {
                            victoryMessage = "Fascists successfully elected Hitler as chancellor!"
                        }
                    } else {
                        players = liberalPlayers.concat(fascistPlayers);
                        headerImage = VictoryLiberalHeader;
                        headerAlt = "Liberal Victory, written in blue with a dove icon.";
                        messageClass = "highlight-blue";
                        if (liberalVictoryPolicy) {
                            victoryMessage = "Liberals successfully passed five policies!";
                        } else if (liberalVictoryExecution) {
                            victoryMessage = "Liberals successfully executed Hitler!";
                        }
                    }
                    if (DEBUG) {
                        console.log("Player ordering: " + players);
                    }
                    this.addAnimationToQueue(() => {
                        this.setState({
                            alertContent: (
                                <ButtonPrompt
                                    renderLabel={() => {
                                        return (
                                            <>
                                                <img
                                                    src={headerImage}
                                                    alt={headerAlt}
                                                    id={"victory-header"}
                                                />
                                                <p style={{textAlign: "center"}} className={messageClass}>
                                                    {victoryMessage}
                                                </p>
                                            </>
                                        );
                                    }}
                                    buttonText={"RETURN TO LOBBY"}
                                    buttonOnClick={() => {
                                        this.gameOver = false;
                                        this.reconnectOnConnectionClosed = true;
                                        this.tryOpenWebSocket(this.state.name, this.state.lobby);
                                        this.hideAlertAndFinish();
                                        this.setState({
                                            page: PAGE.LOBBY,
                                            gameState: DEFAULT_GAME_STATE,
                                            liberalPolicies: 0,
                                            fascistPolicies: 0,
                                            electionTracker: 0,
                                            drawDeckSize: 17,
                                            discardDeckSize: 0,
                                        })
                                    }}
                                >
                                    <PlayerDisplay
                                        players={players}
                                        playerDisabledFilter={DISABLE_NONE}
                                        showRoles={true}
                                        showLabels={false}
                                        useAsButtons={false}
                                        user={this.state.name}
                                        gameState={newState}
                                    />
                                </ButtonPrompt>
                            ),
                            showAlert: true
                        });
                    });
                    this.gameOver = true;
                    this.reconnectOnConnectionClosed = false;
                    this.websocket.close();
                    break;

                default:
                // Do nothing
            }


        }

        // Update the draw decks
        this.addAnimationToQueue(() => {
            this.setState({
                drawDeckSize: newState[PARAM_DRAW_DECK],
                discardDeckSize: newState[PARAM_DISCARD_DECK],
            });
            this.onAnimationFinish();
        });
    }

    //// Animation Handling
    // <editor-fold desc="Animation Handling">

    /**
     * Plays the next animation in the queue if it exists.
     * @effects If {@code this.animationQueue} is not empty,
     *          removes the function at the front of the animation queue and calls it.
     */
    onAnimationFinish() {
        if (this.animationQueue.length > 0) {
            let func = this.animationQueue.shift();
            func(); //call the function.
        } else { // the animation queue is empty, so we set a flag.
            this.allAnimationsFinished = true;
            this.setState({allAnimationsFinished: true});
        }
    }

    /**
     * Clears the animation queue and ends any currently playing animations.
     */
    clearAnimationQueue() {
        this.allAnimationsFinished = true;
        this.setState({allAnimationsFinished: true});
        this.animationQueue = [];
    }

    /**
     * Adds the specified animation to the end of the queue.
     * @param func {function} the function to add to the animation queue.
     * @effects Adds the function to the back of the animation queue. If no animations are currently playing,
     *          starts the specified animation.
     */
    addAnimationToQueue(func) {
        this.animationQueue.push(func);
        if (this.allAnimationsFinished) {
            this.allAnimationsFinished = false;
            this.setState({allAnimationsFinished: false});
            let func = this.animationQueue.shift();
            func(); //call the function.
        }
    }

    showVotes(newState) {
        this.setState({statusBarText: "Tallying votes..."});
        setTimeout(() => {
            this.setState({showVotes: true})
        }, 1000);
        // Calculate final result:

        let noVotes = 0;
        let yesVotes = 0;
        Object.values(newState[PARAM_VOTES]).forEach((value) => {
            if (value) {
                yesVotes++;
            } else {
                noVotes++;
            }
        });
        setTimeout(() => {

            if (yesVotes > noVotes) {
                this.setState({statusBarText: (yesVotes) + " - " + (noVotes) + ": Vote passed"})
            } else {
                this.setState({statusBarText: (yesVotes) + " - " + (noVotes) + ": Vote failed"})
            }
        }, 2000);
        setTimeout(() => this.setState({showVotes: false, statusBarText: ""}), 6000);
        setTimeout(() => {
            this.onAnimationFinish();
        }, 6500);
    }

    /**
     * Adds a listener to be called when the server returns an 'OK' status.
     * @param func The function to be called.
     * @effects adds the listener to the queue of functions. When the server returns an 'OK' status, all of the
     *          listeners will be called and then cleared from the queue.
     */
    addServerOKListener(func) {
        this.okMessageListeners.push(func);
    }


    /**
     * Hides the CustomAlert and marks this animation as finished.
     * @param delayExit {boolean} When true, delays advancing the animation queue until after the alert is hidden.
     * @effects: Sets {@code this.state.showAlert} to false and hides the CustomAlert.
     *           If delayExit is true, waits until the CustomAlert is done hiding before advancing the animation queue.
     *           Otherwise, immediately queues the next animation.
     */
    hideAlertAndFinish(delayExit = true) {
        this.setState({showAlert: false});
        if (delayExit) {
            setTimeout(() => {
                this.onAnimationFinish();
                this.setState({alertContent: <div/>}); // reset the alert box contents
            }, CUSTOM_ALERT_FADE_DURATION);
        } else {
            this.setState({alertContent:<div/>});
            this.onAnimationFinish();
        }
    }

    /**
     * Shows the eventBar for a set period of time.
     * @param message {String} the message for the Event Bar to be fully visible.
     * @param duration {Number} the duration (in ms) for the Event Bar to be visible. (default is 3000 ms).
     * @effects Adds a function to the animation queue that, when called, shows the EventBar with the given message
     *          for {@code duration} ms, then advances to the next animation when finished.
     */
    queueEventUpdate(message, duration = 2000) {
        this.addAnimationToQueue(() => {
            this.setState({
                showEventBar: true,
                eventBarMessage: message
            });
            setTimeout(() => {
                this.setState({showEventBar: false})
            }, duration);
            setTimeout(() => {
                this.onAnimationFinish()
            }, duration + EVENT_BAR_FADE_OUT_DURATION);
        });
    }

    /**
     * Adds a CustomAlert to the animation queue.
     * @param content {html} the contents to be shown in the AlertBox.
     * @param closeOnOK {boolean} whether to close the alert when the server responds with an ok message. (default = true)
     * @effects Adds a new function to the animation queue that, when called, causes a CustomAlert with the
     *          given {@code content} to appear. If {@code closeOnOK} is true, once shown, the alert box will
     *          be closed when the server responds with an 'ok' to any command. (There will be a short delay before the
     *          animation queue advances if not waiting for a server response.)
     */
    queueAlert(content, closeOnOK = true) {
        this.addAnimationToQueue(() => {
            this.setState({
                alertContent: content,
                showAlert: true,
            });
            if (closeOnOK) {
                // Remove the exit delay if waiting for the server response, because otherwise the player will lag
                // behind everyone else.
                this.addServerOKListener(() => this.hideAlertAndFinish(false));
            }
        });
    }

    /**
     * Adds an update to the status message to the animation queue.
     * @param message {String} the text for the status bar to display.
     * @effects Adds a new function to the animation queue that, when called, updates {@code this.state.statusBarText} to
     *          the message provided then instantly advances the animation queue.
     */
    queueStatusMessage(message) {
        this.addAnimationToQueue(() => {
            this.setState({statusBarText: message});
            this.onAnimationFinish();
        })
    }

    // </editor-fold>

    playAnimationTest() {
        /*
        if (this.state.discardDeckSize === 15) {
            this.setState({
                discardDeckSize: 14
            });
        } else {
            this.setState({
                discardDeckSize: 15
            });
        }*/
        this.queueAlert(<IconSelection gameState={this.state.gameState}
                                       onConfirm={this.hideAlertAndFinish}
                                       user={"P1"}
                                       sendWSCommand={this.sendWSCommand} />);
    }

    /**
     * Renders the game page.
     */
    renderGamePage() {
        return (
            <div className="App" style={{textAlign: "center"}}>
                <header className="App-header">
                    SECRET-HITLER.ONLINE
                </header>

                <CustomAlert show={this.state.showAlert}>
                    {this.state.alertContent}
                </CustomAlert>

                <EventBar show={this.state.showEventBar} message={this.state.eventBarMessage}/>

                <div style={{backgroundColor: "var(--backgroundDark)"}}>
                    <PlayerDisplay
                        gameState={this.state.gameState}
                        user={this.state.name}
                        showVotes={this.state.showVotes}
                        showBusy={this.state.allAnimationsFinished} // Only show busy when there isn't an active animation.
                        playerDisabledFilter={DISABLE_EXECUTED_PLAYERS}
                    />
                </div>

                <StatusBar>{this.state.statusBarText}</StatusBar>

                <div style={{display: "inline-block"}}>
                    <div id={"Board Layout"}
                         style={{alignItems: "center", display: "flex", flexDirection: "column", margin: "10px auto"}}>

                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", marginTop: "15px"}}>
                            <Deck cardCount={this.state.drawDeckSize} deckType={"DRAW"}/>

                            <div style={{margin: "auto auto"}}>
                                <button
                                    disabled={this.state.gameState[PARAM_STATE] !== STATE_POST_LEGISLATIVE || this.state.name !== this.state.gameState[PARAM_PRESIDENT]}
                                    onClick={() => {
                                        this.sendWSCommand(COMMAND_END_TERM);
                                    }}
                                > END TERM
                                </button>

                                <PlayerPolicyStatus numFascistPolicies={this.state.fascistPolicies}
                                                    numLiberalPolicies={this.state.liberalPolicies}
                                                    playerCount={this.state.gameState[PARAM_PLAYER_ORDER].length}/>
                            </div>

                            <Deck cardCount={this.state.discardDeckSize} deckType={"DISCARD"}/>
                        </div>

                        <Board
                            numPlayers={this.state.gameState[PARAM_PLAYER_ORDER].length}
                            numFascistPolicies={this.state.fascistPolicies}
                            numLiberalPolicies={this.state.liberalPolicies}
                            electionTracker={this.state.electionTracker}
                        />
                    </div>
                </div>

                <div style={{textAlign: "center"}}>
                    <div id="snackbar">{this.state.snackbarMessage}</div>
                </div>
            </div>
        );
    }

    //</editor-fold>

    render() {
        // Check URL params. If joining from a lobby link, open the lobby with the given code.
        let url = window.location.search;
        let lobby = new URLSearchParams(url).get('lobby');
        if (lobby !== null && !this.state.lobbyFromURL) {
            ReactGA.event({
                category: "Lobby Link",
                action: "User is using a lobby link.",
            });
            this.setState({joinLobby: lobby.toUpperCase().substr(0, 4), lobbyFromURL: true});
        }

        let page_render;
        switch (this.state.page) {
            case PAGE.LOBBY:
                page_render = this.renderLobbyPage();
                break;
            case PAGE.GAME:
                page_render = this.renderGamePage();
                break;
            case PAGE.LOGIN:  // login is default
            default:
                page_render = this.renderLoginPage();
        }
        return (
            <>
                <HelmetMetaData/>
                {page_render}
            </>
        )
    }
}

export default App;
