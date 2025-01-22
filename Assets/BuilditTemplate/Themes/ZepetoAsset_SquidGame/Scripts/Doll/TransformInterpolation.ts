import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {LineRenderer, GameObject, Time, Quaternion, Animator, Transform, AudioSource, Vector3, AnimationClip, Color} from 'UnityEngine';
import {Player} from "ZEPETO.Multiplay.Schema";
import {CharacterState, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import RandomTimeoutScheduler from './RandomTimeoutScheduler';


export default class TransformInterpolation extends ZepetoScriptBehaviour {
    
    public time: float;
    public target: Transform;
    public maxDistance: float;
    
    private targetScale: float;
    public l: Transform;
    public r: Transform;
    public lr: LineRenderer;
    
    private _time: float;
    
    Start() {
        this.targetScale += Vector3.Distance(this.transform.position, this.target.position);
        this._time = this.time;
    }
    
    Update() {
        // this.transform.position = Vector3.MoveTowards(this.transform.position, this.target.position, this.maxDistance * Time.deltaTime);

        let h0 = this.target.position ;
        let h1 = this.transform.position;
        
        
        let line = this.lr;

        line.startWidth = 0.02;
        line.endWidth = 0.02;
        line.startColor = Color.red;
        line.endColor = Color.red;
        line.positionCount = 2;
        line.SetPosition(0, h0);
        line.SetPosition(1, h1);
        line.useWorldSpace = true;
     
        this._time -= Time.deltaTime;
        
        if (this._time <= 0) {
            GameObject.Destroy(this.gameObject);
        }
        
    }
    
}