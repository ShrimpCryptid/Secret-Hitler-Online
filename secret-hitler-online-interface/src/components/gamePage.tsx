import React from 'react'
import CustomAlert from './../custom-alert/CustomAlert';
import EventBar from './../event-bar/EventBar';
import PlayerDisplay, {DISABLE_EXECUTED_PLAYERS} from './../player/PlayerDisplay';
import StatusBar from './../status-bar/StatusBar';
import Deck from './../board/Deck';
import { PARAM_PLAYER_ORDER, PARAM_PRESIDENT, PARAM_STATE, STATE_POST_LEGISLATIVE } from '../GlobalDefinitions';
import PlayerPolicyStatus from '../util/PlayerPolicyStatus';
import Board from '../board/Board';

export default function gamePage(props: {
    showAlert: any,
    alertContent: any,
    showEventBar: any,
    eventBarMessage: any,
    gameState: any,
    name: any,
    showVotes: any,
    allAnimationsFinished: any,
    statusBarText: any,
    drawDeckSize: any,
    onEndTermClick: any, //     this.sendWSCommand(COMMAND_END_TERM);
}) {
    return (
        <div className="App" style={{textAlign: "center"}}>
                <header className="App-header">
                    SECRET-HITLER.ONLINE
                </header>

                <CustomAlert show={props.showAlert}>
                    {props.alertContent}
                </CustomAlert>

                <EventBar show={props.showEventBar} message={props.eventBarMessage}/>

                <div style={{backgroundColor: "var(--backgroundDark)"}}>
                    <PlayerDisplay
                        gameState={props.gameState}
                        user={props.name}
                        showVotes={props.showVotes}
                        showBusy={props.allAnimationsFinished} // Only show busy when there isn't an active animation.
                        playerDisabledFilter={DISABLE_EXECUTED_PLAYERS}
                    />
                </div>

                <StatusBar>{props.statusBarText}</StatusBar>

                <div style={{display: "inline-block"}}>
                    <div id={"Board Layout"}
                         style={{alignItems: "center", display: "flex", flexDirection: "column", margin: "10px auto"}}>

                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", marginTop: "15px"}}>
                            <Deck cardCount={props.drawDeckSize} deckType={"DRAW"}/>

                            <div style={{margin: "auto auto"}}>
                                <button
                                    disabled={props.gameState[PARAM_STATE] !== STATE_POST_LEGISLATIVE || props.name !== props.gameState[PARAM_PRESIDENT]}
                                    onClick={props.onEndTermClick}

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
    )
}
