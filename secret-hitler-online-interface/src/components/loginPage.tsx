import React from 'react'
import { LOBBY_CODE_LENGTH } from '../GlobalDefinitions'
import LoginPageContent from '../LoginPageContent'
import MaxLengthTextField from '../util/MaxLengthTextField'

export default function loginPage(props: {
    joinLobby: any,
    joinName: any,
    joinError: any,
    createLobbyName: any,
    createLobbyError: any,
    onUpdateJoinLobby: (event: any)=>any,
    onUpdateJoinName: (event: any)=>any,
    onClickJoin: (event:any )=> any,
    shouldJoinButtonBeEnabled: () => any,
    onUpdateCreateLobbyName: (event:any)=>any,
    onClickCreateLobby: ()=>any,
    shouldCreateLobbyButtonBeEnabled: ()=>any,
}) {
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
                        onChange={(event: any)=> props.onUpdateJoinLobby(event)}
                        value={props.joinLobby}
                        maxLength={LOBBY_CODE_LENGTH}
                        showCharCount={false}
                        forceUpperCase={true}
                    />

                    <MaxLengthTextField
                        label={"Your Name"}
                        onChange={(event: any)=> props.onUpdateJoinName(event)}
                        value={props.joinName}
                        maxLength={12}
                    />
                    <p id={"errormessage"}>{props.joinError}</p>
                    <button
                        onClick={(event)=>props.onClickJoin(event)}
                        disabled={!props.shouldJoinButtonBeEnabled()}
                    >
                        JOIN
                    </button>
                </div>
                <br/>
                <div>
                    <h2>CREATE A LOBBY</h2>
                    <MaxLengthTextField
                        label={"Your Name"}
                        onChange={(event:any)=>props.onUpdateCreateLobbyName(event)}
                        value={props.createLobbyName}
                        maxLength={12}
                    />
                    <p id={"errormessage"}>{props.createLobbyError}</p>
                    <button
                        onClick={()=>props.onClickCreateLobby()}
                        disabled={!props.shouldCreateLobbyButtonBeEnabled()}
                    >
                        CREATE LOBBY
                    </button>
                </div>
                <br/>
                <LoginPageContent />
            </div>
    )
}
