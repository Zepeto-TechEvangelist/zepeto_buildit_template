import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {AnimationClip, Animator, AudioSource, Collider, GameObject, Quaternion} from 'UnityEngine';
import {Player} from "ZEPETO.Multiplay.Schema";

import VotingArea from './VotingArea';
import { TextMeshPro } from 'TMPro';


export default class VotingManager extends ZepetoScriptBehaviour {

    private _area_x: VotingArea;
    private _area_y: VotingArea;
    @SerializeField() private _displayX: TextMeshPro;
    @SerializeField() private _displayO: TextMeshPro;
    
    Start() {
        let areas = this.GetComponentsInChildren<VotingArea>();
        if (areas[0].name === "X") {
            this._area_x = areas[0];
            this._area_y = areas[1];
        }
        else {
            this._area_x = areas[1];
            this._area_y = areas[0];
        }
        
        this._area_x.manager = this;
        this._area_y.manager = this;
        
    }
    
    public OnUpdateVotingAreaValue(area: VotingArea) {
        
        this._displayX.text = "" + this._area_x.votes
        this._displayO.text = "" + this._area_y.votes;
    }
    
}