import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject } from 'UnityEngine';

export default class DigitalDisplay extends ZepetoScriptBehaviour {

    public segments: GameObject[];

    private _value: int = -1;
    public value: int;

    // public set value(value: int) {
    //     this.SetValue(value);
    // };
    // public get value() { return this._value };
    
    private digit_conf = [
        [1, 1, 1, 0, 1, 1, 1],  // 0
        [0, 0, 1, 0, 0, 1, 0],  // 1
        [1, 0, 1, 1, 1, 0, 1],  // 2
        [1, 0, 1, 1, 0, 1, 1],  // 3
        [0, 1, 1, 1, 0, 1, 0],  // 4
        [1, 1, 0, 1, 0, 1, 1],  // 5
        [1, 1, 0, 1, 1, 1, 1],  // 6
        [1, 0, 1, 0, 0, 1, 0],  // 7
        [1, 1, 1, 1, 1, 1, 1],  // 8
        [1, 1, 1, 1, 0, 1, 0],  // 9
    ];
    
    Start() {    
        // Requires 7 segments
        if (this.segments.length == 0) 
        {
            console.error("Invalid configuration")
        }
        
    }

    Update() {
        if (this.value != this._value)
            this.SetValue(this.value);  // is dirty
    }
    
    public SetValue(value: int) {
        this._value = value;
        this.value = value;
        
        for (var i = 0; i < 7; i++)
            this.segments[i].active = this.digit_conf[value][i] == 1;
    }
    
}