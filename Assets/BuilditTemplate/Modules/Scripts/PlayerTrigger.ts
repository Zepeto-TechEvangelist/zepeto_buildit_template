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

    public OnPlayerEnter: UnityEvent$1<ZepetoCharacter>;

    public OnPlayerStay: UnityEvent$1<ZepetoCharacter>;

    public OnPlayerExit: UnityEvent$1<ZepetoCharacter>;

    @HideInInspector() public delegate: PlayerTriggerInterface;
    
    // ---------------------------------------------------------------- //
    
    protected CheckForCharacter(character: ZepetoCharacter): ZepetoCharacterType {
        if (ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character === character)
        // if (character.gameObject.tag == "LocalPlayer")
            return ZepetoCharacterType.LocalPlayer;

        return ZepetoCharacterType.NetworkPlayer;
    }
    
    protected _OnTrigger(collider: Collider, execute: (character: ZepetoCharacter, type: ZepetoCharacterType) => void ) {
        var character: ZepetoCharacter = collider.GetComponent<ZepetoCharacter>();
        if (character /*collider.TryGetComponent<ZepetoCharacter>( $ref(character) )*/) {
            
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
            this.OnPlayerEnter?.Invoke(character);
        });
    }

    protected OnTriggerStay(collider: Collider) {
        this._OnTrigger(collider, (character: ZepetoCharacter, type: ZepetoCharacterType) => {
            if (this.delegate?.OnPlayerStay) this.delegate?.OnPlayerStay(character, type);
            this.OnPlayerStay?.Invoke(character);
        });
    }
    
    protected OnTriggerExit(collider: Collider) {
        this._OnTrigger(collider, (character: ZepetoCharacter, type: ZepetoCharacterType) => {
            if (this.delegate?.OnPlayerExit) this.delegate?.OnPlayerExit(character, type);
            this.OnPlayerExit?.Invoke(character);
        });
    }

    // ---------------------------------------------------------------- //
}