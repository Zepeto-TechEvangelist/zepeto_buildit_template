import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {Transform, Vector3, Time, Collider, WaitForSeconds, Coroutine, GameObject} from 'UnityEngine';

export default class ShakeAnimation extends ZepetoScriptBehaviour {

    private _startPos: Vector3;
    private _timer: float;
    private _randomPos: Vector3;
    private _intervalPos: Vector3;
    private _intervalTimer: float;

    @Header("Settings")

    public time: float = 0.2;
    public distance: float = 0.1;
    public interval: float = 0;

    public curveTimer: float = 0;
    public intervalCurve: float = 0;
    public distanceCurve: float = 0;
    private _curveTimer: float = 0;
    
    private Awake() {
        this._startPos = this.transform.position;
    }

    public OnEnable() {
        this.StopAllCoroutines();
        this._intervalTimer = this.interval;
        this.StartCoroutine(this.Shake());
    }

    private* Shake() {
        this._timer = 0;

        while (this._timer < this.time) {
            this._timer += Time.deltaTime;

            if ((this.intervalCurve != 0 || this.distanceCurve != 0) && this._curveTimer > this.curveTimer) {
                this.interval += this.intervalCurve;
                this._curveTimer = 0;
            }
            
            if (this._intervalTimer >= this.interval) {
                
                this._intervalTimer = 0;
                this._intervalPos = this.transform.position;
                this._randomPos = this._startPos + new Vector3(
                    Math.random() * this.distance, 
                    Math.random() * this.distance, 
                    Math.random() * this.distance);
            }
            this._intervalTimer += Time.deltaTime;
            this._curveTimer += Time.deltaTime;
            
            // Lerp to the position
            this.transform.position = //this._randomPos;
            Vector3.Lerp(this._intervalPos, this._randomPos,this._intervalTimer / this.interval);
            
            yield null;
        }

        this.transform.position = this._startPos;
    }

}