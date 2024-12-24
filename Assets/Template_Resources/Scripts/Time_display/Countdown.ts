import { Time } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TimeDisplay from './TimeDisplay';
import {UnityEvent} from "UnityEngine.Events";

export default class Countdown extends ZepetoScriptBehaviour {
    
    public maxValue: int;
    public minValue: int = 0;
    public value: int;

    private display: TimeDisplay;
    
    public interval: int = 1;  // ms
    private timeout: int = 0;

    // @HideInInspector()
    public OnFinished: UnityEvent;
    
    public OnTimer: UnityEvent;
    
    Start() {    
        this.display = this.GetComponent<TimeDisplay>();
        this.value = this.maxValue;
        this.timeout = this.interval;
    }

    LateUpdate() {
        this.timeout -= Time.deltaTime;
        
        if (this.timeout <= 0) {
            this.timeout += this.interval;
            
            this.Step();
        }
    }
    
    private Step() {
        this.value = this.value - 1;
        
        if (this.value <= this.minValue) {
            this.value = this.minValue;

            
            this.OnFinished?.Invoke();
        }

        this.display.SetValue(this.value);
    }
   
}