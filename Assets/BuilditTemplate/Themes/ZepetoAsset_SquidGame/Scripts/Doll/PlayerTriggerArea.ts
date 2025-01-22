import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {AnimationClip, Animator, AudioSource, Collider, GameObject, Quaternion} from 'UnityEngine';
import {Player} from "ZEPETO.Multiplay.Schema";

import {ZepetoCharacter, CharacterState, KnowSockets, ZepetoPlayers} from 'ZEPETO.Character.Controller';
// import ZepetoPlayersManager from '../../../Zepeto Multiplay Component/ZepetoScript/Player/ZepetoPlayersManager';
import { UnityEvent } from 'UnityEngine.Events';
import { Action$1 } from "System";


export default class PlayerTriggerArea extends ZepetoScriptBehaviour {

    public playerCount: int = 0;
    public _entered: Collider[] = [];

    public OnEnter: Action$1<ZepetoCharacter> = null;
    public OnExit: Action$1<ZepetoCharacter> = null;
    // @HideInInspector() public manager: VotingManager;

    private OnTriggerEnter(collider: Collider) {

        // Check if player has entered 
        var character = collider.gameObject.GetComponent<ZepetoCharacter>();
        if (character === null) 
            return;
        
        if (this._entered.findIndex(x => x === collider) !== -1)
            return;
        
        // Increase player count
        this.playerCount++;
        this._entered.push(collider);
        
        if (this.OnEnter) this.OnEnter(character);
    }

    private OnTriggerExit(collider: Collider) {

        // Check if player has entered
        // TODO: If possible solve it with a mask
        var character = collider.gameObject.GetComponent<ZepetoCharacter>();
        if (character === null)
            return;
        
        let index = this._entered.findIndex(x => x === collider);
        if (index === -1)
            return;

        // Decrease player count
        this.playerCount--;
        this._entered.splice(index, 1);

        if (this.OnExit)
            this.OnExit(character);
    }
}
