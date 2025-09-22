import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Transform, Vector3, Time, Collider, WaitForSeconds, Coroutine } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {UnityEvent, UnityEvent$1} from "UnityEngine.Events";

export interface PlayerTriggerInterface {
    OnPlayerEnter?(character?: ZepetoCharacter, type?: ZepetoCharacterType)
    OnPlayerStay?(character?: ZepetoCharacter, type?: ZepetoCharacterType)
    OnPlayerExit?(character?: ZepetoCharacter, type?: ZepetoCharacterType)
}
export type IPlayerTrigger = PlayerTriggerInterface;


export enum ZepetoCharacterType {
    LocalPlayer,
    NetworkPlayer,
    NPC
}

export default class PlayerTrigger extends ZepetoScriptBehaviour {
    
    public detectLocalPlayer: boolean;
    
    public detectNetworkPlayer: boolean;
    
    public detectNpc: boolean;
    
    // Interface -------------------------------------------------------//

    protected _OnPlayerEnter: UnityEvent$1<ZepetoCharacter>;
    public get OnPlayerEnter(): UnityEvent$1<ZepetoCharacter> { 
        if (!this._OnPlayerEnter) this._OnPlayerEnter = new UnityEvent$1<ZepetoCharacter>(); 
        return this._OnPlayerEnter;
    }
    public set OnPlayerEnter(event: UnityEvent$1<ZepetoCharacter>) {
        this._OnPlayerEnter = event;
    }

    protected _OnPlayerStay: UnityEvent$1<ZepetoCharacter>;
    public get OnPlayerStay(): UnityEvent$1<ZepetoCharacter> {
        this._OnPlayerStay ??= new UnityEvent$1<ZepetoCharacter>();
        return this._OnPlayerStay;
    }
    public set OnPlayerStay(event: UnityEvent$1<ZepetoCharacter>) {
        this._OnPlayerStay = event;
    }
    
    protected _OnPlayerExit: UnityEvent$1<ZepetoCharacter>;
    public get OnPlayerExit(): UnityEvent$1<ZepetoCharacter> {
        this._OnPlayerExit ??= new UnityEvent$1<ZepetoCharacter>();
        return this._OnPlayerExit;
    }
    public set OnPlayerExit(event: UnityEvent$1<ZepetoCharacter>) {
        this._OnPlayerExit = event;
    }
    
    @HideInInspector() public delegate: PlayerTriggerInterface;
    
    // ---------------------------------------------------------------- //
    
    protected CheckForCharacter(character: ZepetoCharacter): ZepetoCharacterType {
        if (!ZepetoPlayers.instance.LocalPlayer)
            return ZepetoCharacterType.NPC;
        
        if (ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character === character)
            return ZepetoCharacterType.LocalPlayer;

        return ZepetoCharacterType.NetworkPlayer;
    }
    
    protected _OnTrigger(collider: Collider, execute: (character: ZepetoCharacter, type: ZepetoCharacterType) => void ) {
        var character: ZepetoCharacter = collider.GetComponent<ZepetoCharacter>();
        if (character) {
            
            switch (this.CheckForCharacter(character)) {
                case ZepetoCharacterType.LocalPlayer:
                    if (this.detectLocalPlayer) 
                        execute(character, ZepetoCharacterType.LocalPlayer);
                    break;
                case ZepetoCharacterType.NetworkPlayer:
                    if (this.detectNetworkPlayer) 
                        execute(character, ZepetoCharacterType.NetworkPlayer);
                    break;
                case ZepetoCharacterType.NPC:
                    if (this.detectNpc) 
                        execute(character, ZepetoCharacterType.NPC);
                    break;
            }

        }
    }
    
    protected OnTriggerEnter(collider: Collider) {
        this._OnTrigger(collider, (character: ZepetoCharacter, type: ZepetoCharacterType) => {
            if (this.delegate?.OnPlayerEnter) this.delegate?.OnPlayerEnter(character, type);
            this._OnPlayerEnter?.Invoke(character);
        });
    }

    protected OnTriggerStay(collider: Collider) {
        this._OnTrigger(collider, (character: ZepetoCharacter, type: ZepetoCharacterType) => {
            if (this.delegate?.OnPlayerStay) this.delegate?.OnPlayerStay(character, type);
            this._OnPlayerStay?.Invoke(character);
        });
    }
    
    protected OnTriggerExit(collider: Collider) {
        this._OnTrigger(collider, (character: ZepetoCharacter, type: ZepetoCharacterType) => {
            if (this.delegate?.OnPlayerExit) this.delegate?.OnPlayerExit(character, type);
            this._OnPlayerExit?.Invoke(character);
        });
    }

    // ---------------------------------------------------------------- //

    // Start() {
    //     // automatic binding
    //     if (!this.delegate) {
    //         this.delegate = this.GetComponent<IPlayerTrigger>();
    //     }
    // }
}