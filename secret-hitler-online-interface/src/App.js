import React, {Component} from 'react';
import './App.css';
import MaxLengthTextField from "./util/MaxLengthTextField";
import './fonts.css';

import PolicyBack from "./assets/board-policy.png";

import DrawDeck from "./assets/board-draw.png";
import DiscardDeck from "./assets/board-discard.png";
import CustomAlert from "./custom-alert/CustomAlert";
import RoleAlert from "./custom-alert/RoleAlert";
import EventBar from "./EventBar";

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
    PLAYER_NAME,
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
    PACKET_PEEK,
    PACKET_OK,
    STATE_SETUP,
    PLAYER_IS_ALIVE,
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
    STATE_PP_ELECTION, PARAM_ELEC_TRACKER_ADVANCED, COMMAND_END_TERM
} from "./GlobalDefinitions";

import PlayerDisplay from "./player/PlayerDisplay";
import StatusBar from "./status-bar/StatusBar";
import Board from "./board/Board";
import NominationPrompt from "./custom-alert/NominationPrompt";
import VotingPrompt from "./custom-alert/VotingPrompt";
import PresidentLegislativePrompt from "./custom-alert/PresidentLegislativePrompt";
import ChancellorLegislativePrompt from "./custom-alert/ChancellorLegislativePrompt";
import VetoPrompt from "./custom-alert/VetoPrompt";
import ElectionTrackerAlert from "./custom-alert/ElectionTrackerAlert";
import PolicyEnactedAlert from "./custom-alert/PolicyEnactedAlert";

const EVENT_BAR_FADE_OUT_DURATION = 500;
const CUSTOM_ALERT_FADE_DURATION = 1000;

class App extends Component {

    websocket = undefined;
    failedConnections = 0;
    reconnectOnConnectionClosed = true;
    snackbarMessages = 0;
    animationQueue = [];
    okMessageListeners = [];
    allAnimationsFinished = true;

    // noinspection DuplicatedCode
    constructor(props) {
        super(props);
        this.state={
            page:PAGE.LOGIN,

            joinName:"",
            joinLobby:"",
            joinError:"",
            createLobbyName:"",
            createLobbyError:"",
            name:"P4",
            lobby:"AAAAAA",

            usernames:[],
            userCount:1,

            gameState: {"liberal-policies":0,"fascist-policies":0,"discard-size":0,"draw-size":17,
                "players":{"P1":{"alive":true,"id":"FASCIST","investigated":false},"P2":{"alive":true,"id":"HITLER","investigated":false},"P3":{"alive":true,"id":"LIBERAL","investigated":false},"P4":{"alive":true,"id":"LIBERAL","investigated":false},"P5":{"alive":true,"id":"LIBERAL","investigated":false},"P6":{"alive":false,"id":"FASCIST","investigated":false},"P7":{"alive":true,"id":"LIBERAL","investigated":false}},"in-game":true,"player-order":["P4","P2","P6","P1","P7","P3","P5"],
                "state":STATE_SETUP,"last-president": "P7", "last-chancellor": "P3", "president":"P4", "chancellor":"P5", "election-tracker":0,
                "user-votes":{"P4": true, "P2": false, "P1": false, "P7": true, "P3": false, "P5": true}},
            lastState: {}, /* Stores the last gameState[PARAM_STATE] value to check for changes. */
            liberalPolicies: 0,
            fascistPolicies: 0,
            electionTracker: 0, /*The position of the election tracker, ranging from 0 to 3.*/
            showVotes: false,
            drawDeckSize: 17,
            discardDeckSize: 0,

            snackbarMessage:"",

            showAlert: false,
            alertContent: <div />,

            showEventBar: false,
            eventBarMessage: "",

            statusBarText:"Game Starting",
            allAnimationsFinished: true
        };

        // These are necessary for handling class fields (ex: websocket)
        this.onWebSocketClose = this.onWebSocketClose.bind(this);
        this.tryOpenWebSocket = this.tryOpenWebSocket.bind(this);
        this.onClickLeaveLobby = this.onClickLeaveLobby.bind(this);
        this.onClickCopy = this.onClickCopy.bind(this);
        this.onClickStartGame = this.onClickStartGame.bind(this);
        this.sendWSCommand = this.sendWSCommand.bind(this);
        this.playAnimationTest = this.playAnimationTest.bind(this);
        this.testAlert = this.testAlert.bind(this);
        this.showSnackBar = this.showSnackBar.bind(this);
        this.onAnimationFinish = this.onAnimationFinish.bind(this);
        this.onGameStateChanged = this.onGameStateChanged.bind(this);
        this.hideAlertAndFinish = this.hideAlertAndFinish.bind(this);
        this.addAnimationToQueue = this.addAnimationToQueue.bind(this);
        this.clearAnimationQueue = this.clearAnimationQueue.bind(this);
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
            this.showSnackBar("Lost connection to the server: retrying...");
            this.tryOpenWebSocket(this.state.name, this.state.lobby);
        } else if (this.reconnectOnConnectionClosed) {
            this.setState({
                page: PAGE.LOGIN,
                joinName: decodeURIComponent(this.state.name),
                joinLobby: decodeURIComponent(this.state.lobby),
                joinError: "Disconnected from the lobby."
            });
            this.clearAnimationQueue();
        } else { // User purposefully closed the connection.
            this.setState({
                page: PAGE.LOGIN,
                joinName: decodeURIComponent(this.state.name),
                joinError: ""
            });
            this.clearAnimationQueue();
        }
    }

    async onWebSocketMessage(msg) {
        console.log(msg.data);
        this.failedConnections = 0;
        let message = JSON.parse(msg.data);

        switch (message[PARAM_PACKET_TYPE]) {
            case PACKET_LOBBY:
                this.setState({
                    userCount:message[PARAM_USER_COUNT],
                    usernames:message[PARAM_USERNAMES],
                    page: PAGE.LOBBY
                });
                break;

            case PACKET_GAME_STATE:
                if (message !== this.state.gameState) {
                    this.onGameStateChanged(message);
                }
                this.setState({gameState: message, page: PAGE.GAME});
                break;

            case PACKET_OK: // Traverse all listeners and call the functions.
                let i = 0;
                for (i; i < this.okMessageListeners.length; i++) {
                    this.okMessageListeners[i]();
                }
                this.okMessageListeners = []; // clear all listeners.
                break;

            case PACKET_INVESTIGATION:
            case PACKET_PEEK:
            default:
                // Unrecognized.
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

        console.log(JSON.stringify(data));
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
            .catch(() => {
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
        .catch(() => {
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
            out[i] = <p style={{marginBottom:"0px", marginTop:"2px"}}>{" - " + decodeURIComponent(name)}</p>;
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
        this.showSnackBar("Copied!")
    }

    showSnackBar(message) {
        this.setState({snackbarMessage: message});
        let snackbar = document.getElementById("snackbar");
        snackbar.className = "show";
        this.snackbarMessages++;
        setTimeout(() => {
                this.snackbarMessages--;
                if(this.snackbarMessages === 0) {
                    snackbar.className = snackbar.className.replace("show", "");
                }
            }, 3000);
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
                        <textarea id="linkText" readOnly={true} value={"secret-hitler.online/join/" + this.state.lobby}/>
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

        // Check for changes in enacted policies and election tracker.
        if (state === STATE_POST_LEGISLATIVE || state === STATE_PP_INVESTIGATE || state === STATE_PP_EXECUTION
            || state === STATE_PP_ELECTION || state === STATE_PP_ELECTION) {

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
                            closeAlert={this.hideAlertAndFinish} />
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
                        policyType={liberalChanged ? LIBERAL : FASCIST} />
                ));
            }


            // Update the board with the new policies / election tracker.
            this.addAnimationToQueue(() => {
                this.setState({
                    liberalPolicies: newState[PARAM_LIBERAL_POLICIES],
                    fascistPolicies: newState[PARAM_FASCIST_POLICIES],
                    electionTracker: newState[PARAM_ELECTION_TRACKER],
                });
                setTimeout(()=>this.onAnimationFinish(), 500);
            })
        }

        // Check for state change
        if (newState[PARAM_STATE] !== this.state.gameState[PARAM_STATE]) { // state has changed
            switch (newState[PARAM_STATE]) {

                case STATE_CHANCELLOR_NOMINATION:
                    if(newState[PARAM_ELECTION_TRACKER] === 0
                        && newState[PARAM_LIBERAL_POLICIES] === 0
                        && newState[PARAM_FASCIST_POLICIES] === 0) {
                        // If the game has just started (everything in default state), show the player's role.
                        this.queueAlert(
                            <RoleAlert
                                role={newState[PARAM_PLAYERS][this.state.name][PLAYER_IDENTITY]}
                                gameState={newState}
                                name={name}
                                onClick={() => { this.hideAlertAndFinish(); }}
                            />
                            , false);
                    }

                    this.queueEventUpdate("CHANCELLOR NOMINATION");
                    this.queueStatusMessage("Waiting for president to nominate a chancellor.");

                    if(isPresident) {
                        //Show the chancellor nomination window.
                        this.queueAlert(
                            <NominationPrompt
                                gameState={newState}
                                user={name}
                                sendWSCommand={this.sendWSCommand}
                            />
                        );
                    }

                    break;

                case STATE_CHANCELLOR_VOTING:
                    this.setState({statusBarText: ""});
                    this.queueEventUpdate("VOTING");
                    this.queueStatusMessage("Waiting for all players to vote.");
                    this.queueAlert(
                        <VotingPrompt
                            gameState={newState}
                            sendWSCommand={this.sendWSCommand}
                            user={this.state.name}
                        />
                        , true
                    );

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
                    //TODO: Animate cards being added to discard deck.
                    this.queueStatusMessage("Waiting for the chancellor to choose a policy to enact.");
                    if (isChancellor) {
                        this.queueAlert(
                            <ChancellorLegislativePrompt
                                fascistPolicies={newState[PARAM_FASCIST_POLICIES]}
                                showError={(message) => this.setState({snackbarMessage: message})}
                                policyOptions={newState[PARAM_CHANCELLOR_CHOICES]}
                                sendWSCommand={this.sendWSCommand}
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
                        )
                    }
                    break;

                case STATE_POST_LEGISLATIVE:
                    this.queueStatusMessage("Waiting for the president to conclude their term.");

            }


        }

        // Check for change in election tracker. => show the change via an alert.

        // Check for change in policy counts.
        // Show an alert for policies being enacted.
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
        setTimeout(() => { this.setState({showVotes: true}) }, 1000);
        // Calculate final result:

        let noVotes = 0;
        let yesVotes = 0;
        Object.values(newState[PARAM_VOTES]).forEach((value) => {
            if (value) { yesVotes++; }
            else { noVotes++; }
        });
        setTimeout(() => {

            if (yesVotes > noVotes) {
                this.setState({statusBarText: (yesVotes) + " - " + (noVotes) + ": Vote passed"})
            } else {
                this.setState({statusBarText: (yesVotes) + " - " + (noVotes) + ": Vote failed"})
            }
        }, 2000);
        setTimeout(() => this.setState({showVotes: false, statusBarText: ""}), 6000);
        setTimeout(() => {this.onAnimationFinish(); }, 6500);
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
     * @effects: Sets {@code this.state.showAlert} to false and hides the CustomAlert. Once the CustomAlert is done
     *           hiding, advances the animation queue.
     */
    hideAlertAndFinish() {
        this.setState({showAlert: false});
        setTimeout(() => {this.onAnimationFinish()}, CUSTOM_ALERT_FADE_DURATION);
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
            setTimeout(() => {this.setState({showEventBar:false})}, duration);
            setTimeout(() => {this.onAnimationFinish()}, duration + EVENT_BAR_FADE_OUT_DURATION);
        });
    }

    /**
     * Adds a CustomAlert to the animation queue.
     * @param content {html} the contents to be shown in the AlertBox.
     * @param closeOnOK {boolean} whether to close the alert when the server responds with an ok message. (default = true)
     * @effects Adds a new function to the animation queue that, when called, causes a CustomAlert with the
     *          given {@code content} to appear. If {@code closeOnOK} is true, once shown, the alert box will
     *          be closed when the server responds with an 'ok' to any command.
     */
    queueAlert(content, closeOnOK=true) {
        this.addAnimationToQueue(() => {
            this.setState({
                alertContent: content,
                showAlert: true,
            });
            if (closeOnOK) {
                this.addServerOKListener(() => this.hideAlertAndFinish());
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
        this.setState({
            showVotes: !this.state.showVotes
        });

    }

    /**
     * Shows a sample test alert.
     */
    testAlert() {
        this.setState({
            alertContent:(
                <PolicyEnactedAlert
                    policyType={"FASCIST"}
                    hideAlert={this.hideAlertAndFinish}
                />
            ),
            showAlert: true
        });
    }

    /**
     * Renders the game page.
     */
    renderGamePage() {
        return (
            <div className="App" style={{textAlign:"center"}}>
                <header className="App-header">
                    SECRET HITLER ONLINE
                </header>

                <CustomAlert show={this.state.showAlert}>
                    {this.state.alertContent}
                </CustomAlert>

                <EventBar show={this.state.showEventBar} message={this.state.eventBarMessage}/>

                <PlayerDisplay
                    gameState={this.state.gameState}
                    user={this.state.name}
                    showVotes={this.state.showVotes}
                    showBusy={this.state.allAnimationsFinished} // Only show busy when there isn't an active animation.
                />

                <StatusBar>{this.state.statusBarText}</StatusBar>

                <div style={{display:"inline-block"}}>
                    <div id={"Board Layout"} style={{alignItems:"center", display:"flex", flexDirection:"column", margin:"10px auto"}}>

                        <div style={{display:"flex", flexDirection:"row"}}>
                            <div id={"draw-deck"}>
                                <img src={DrawDeck} style={{width:"11vmin"}} alt={"The draw deck. (" + this.state.drawDeckSize + " cards)"}/>
                            </div>

                            <div>
                                <button
                                    disabled={this.state.gameState[PARAM_STATE] !== STATE_POST_LEGISLATIVE || this.state.name !== this.state.gameState[PARAM_PRESIDENT]}
                                    onClick={() => {this.sendWSCommand(COMMAND_END_TERM);}}
                                >END TERM</button>
                            </div>

                            <div id={"discard-deck"} style={{position:"relative"}}>
                                <img src={DiscardDeck} style={{width:"11vmin"}} alt={"The discard deck. (" + this.state.discardDeckSize + " cards)"}/>
                                <div>
                                    <img id="Discard1" src={PolicyBack} style={{width:"7.5vmin", position:"absolute", top:"9%", left:"16%"}} />
                                </div>
                                <img id="Discard2" src={PolicyBack} style={{width:"7.5vmin", position:"absolute", top:"6%", left:"16%"}} />
                                <img id="Discard3" src={PolicyBack} style={{width:"7.5vmin", position:"absolute", top:"3%", left:"16%"}} />
                                <img id="Discard4" src={PolicyBack} style={{width:"7.5vmin", position:"absolute", top:"0%", left:"16%"}} />
                                <div style={{position:"absolute", top:"-3%", left:"16%"}}>
                                    <img className="" id="target" src={PolicyBack} style={{width:"7.5vmin", position:"relative", zIndex:"5"}} />
                                </div>
                                <p style={{marginTop:"0px"}}>4</p>
                            </div>
                        </div>

                        <Board
                            numPlayers={this.state.gameState[PARAM_PLAYER_ORDER].length}
                            numFascistPolicies={this.state.fascistPolicies}
                            numLiberalPolicies={this.state.liberalPolicies}
                            electionTracker={this.state.electionTracker}
                        />


                    </div>

                    <button
                        onClick={this.testAlert}
                    >Show Alert</button>


                </div>

                <div style={{textAlign:"center"}}>
                    <div id="snackbar">{this.state.snackbarMessage}</div>
                </div>

                <button
                    onClick={this.playAnimationTest}>
                    Test Animation
                </button>

            </div>
        );
    }

    //</editor-fold>

    render() {
        switch (this.state.page) {
            case PAGE.LOGIN:
                return this.renderLoginPage();
            case PAGE.LOBBY:
                return this.renderLobbyPage();
            case PAGE.GAME:
                return this.renderGamePage();
            default:
                return this.renderLoginPage;
        }
    }
}

export default App;
