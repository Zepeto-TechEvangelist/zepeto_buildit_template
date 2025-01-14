import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {AnimationClip, Animator, AudioSource, Collider, GameObject, Quaternion} from 'UnityEngine';
import {Player} from "ZEPETO.Multiplay.Schema";

import { UnityEvent } from 'UnityEngine.Events';
import VotingManager from './VotingManager';



export default class VotingArea extends ZepetoScriptBehaviour {

    public votes: int = 0;
    public _entered: Collider[] = [];
    
    @HideInInspector() public manager: VotingManager;
    
    private OnTriggerEnter(collider: Collider) {
        
        if (this._entered.findIndex(x => x === collider) !== -1)
            return;
        // Increase player count
        this.votes++;
        this._entered.push(collider);
        
        this.manager.OnUpdateVotingAreaValue(this);
    }
    
    private OnTriggerExit(collider: Collider) {

        let index = this._entered.findIndex(x => x === collider);
        if (index === -1)
            return;
        
        // Decrease player count
        this.votes--;
        this._entered.splice(index, 1);

        this.manager.OnUpdateVotingAreaValue(this);
    }
}
