import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {UnityEvent} from "UnityEngine.Events";
import {Time} from "UnityEngine";

export default class RandomTimeoutScheduler extends ZepetoScriptBehaviour {

    // Public
    public paused: boolean = true;
    
    @HideInInspector() public repeatCount: int = -1;
    @HideInInspector() public interval: number = 1;
    @HideInInspector() public min: number = 2.5;
    @HideInInspector() public max: number = 5;

    public OnFinished: UnityEvent;
    public OnTimer: UnityEvent;
    
    private _repeat: int = 0;
    private _deltaTime: int = 0;
    
    
    private Reset() {

        this._deltaTime = 0;
        this._repeat = 0;
        this.paused = true;
    }
    
    public Schedule(time: float) {
        
        this.Reset();
        
        this.interval = time;
        this._deltaTime = this.interval;
        this.repeatCount = 0;

        this.paused = false;
    }
    
    public ScheduleRandom() {
        const random = this.min + Math.random() % (this.max - this.min);
        this.Schedule(random);
    }
    
    /// Implementation
    
    Update() {
        if (this.paused) return;
        
        this._deltaTime -= Time.deltaTime;

        if (this._deltaTime <= 0) {
            // this.interval = this.min + Math.random() * (this.max - this.min);
            this._deltaTime += this.interval;

            this.StartCoroutine(this.Step());
        }
    }
    
    private *Step() {
        this.OnTimer?.Invoke();
        this._repeat++;
        
        if (this.repeatCount > -1 && this._repeat >= this.repeatCount) {
            // this.enabled = false;
            this.OnFinished?.Invoke();
        }
    }
    
    
    Resume() {
        if (this._deltaTime <= 0) {
            // this.interval = this.min + Math.random() % (this.max - this.min);
            this._deltaTime += this.interval;
        }
        
        this.paused = false;
    }
    
    Pause() {
        this.paused = true;
    }
}