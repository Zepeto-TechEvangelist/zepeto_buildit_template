import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {AnimationClip, Animator, AudioSource, Collider, GameObject, Quaternion} from 'UnityEngine';

import SceneManager from './../../Modules/Scripts/SceneManager';
import {Player} from "ZEPETO.Multiplay.Schema";

import {ZepetoCharacter, CharacterState, KnowSockets, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import ZepetoPlayersManager from '../../../Zepeto Multiplay Component/ZepetoScript/Player/ZepetoPlayersManager';
import { UnityEvent } from 'UnityEngine.Events';
import { Action$1 } from "System";


export default class PlayerTriggerArea extends ZepetoScriptBehaviour {

    public playerCount: int = 0;
    public _entered: Collider[] = [];

    public OnEnter: Action$1<ZepetoCharacter>;
    public OnExit: Action$1<ZepetoCharacter>;
    // @HideInInspector() public manager: VotingManager;

    private OnTriggerEnter(collider: Collider) {

        // Check for player
        var character = collider.gameObject.GetComponent<ZepetoCharacter>();
        if (character === null) 
            return;
        
        if (this._entered.findIndex(x => x === collider) !== -1)
            return;
        // Increase player count
        this.playerCount++;
        this._entered.push(collider);

        // this.manager.OnUpdateVotingAreaValue(this);
        // this.OnEnter?;
        this.OnEnter(character);
    }

    private OnTriggerExit(collider: Collider) {

        var character = collider.gameObject.GetComponent<ZepetoCharacter>();
        if (character === null)
            return;
        
        let index = this._entered.findIndex(x => x === collider);
        if (index === -1)
            return;

        // Decrease player count
        this.playerCount--;
        this._entered.splice(index, 1);

        this.OnExit(character);
    }
}
