import { Time } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {UnityEvent} from "UnityEngine.Events";
import TimeDisplay from './TimeDisplay';

export default class Countdown extends ZepetoScriptBehaviour {
    
    public maxValue: int;
    public minValue: int = 0;
    public value: int;
    
    public interval: int = 1;  // ms
    public timeout: int = 0;

    public OnFinished: UnityEvent;
    public OnTimer: UnityEvent;
    
    private display: TimeDisplay;
    
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