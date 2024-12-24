import { GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
// import DigitalDisplay from './DigitalDisplay';
import { TextMeshPro } from 'TMPro';

export default class TimeDisplay extends ZepetoScriptBehaviour {

    // public segments: GameObject[];  // requires 4 segments
    // private _segments: DigitalDisplay[] = [];
        
    private _value: int;
    public value: int;
    
    @SerializeField() private _display: TextMeshPro;
    
    Start() {  
        this._value = this.value;
        
        // for (var i = 0; i < 4; i++)
        //     this._segments[i] = this.segments[i].GetComponent<DigitalDisplay>();
    
        this._value = -1;
    }

    Update() {
        if (this.value != this._value)
            this.SetValue(this.value);  // is dirty
    }

    public SetValue(value: int) {
        this._value = value;
        this.value = value; // to support Editor

        // min / seconds
        let min = Math.trunc(value / 60);
        let sec = value % 60;
        
        // console.log(`Will set time ${min}:${sec}`);
        // this._segments[0].SetValue(Math.trunc(min / 10));
        // this._segments[1].SetValue(min % 10);
        // this._segments[2].SetValue(Math.trunc(sec / 10));
        // this._segments[3].SetValue(sec % 10);

        this._display.text = 
            Math.trunc(min / 10) + "" + (min % 10) + 
            ":" +
            Math.trunc(sec / 10) + "" + (sec % 10);
    }
    
    public SetSegments(lval: int, rval: int) {
        // this._segments[0].SetValue(Math.trunc(lval / 10));
        // this._segments[1].SetValue(lval % 10);
        //
        // this._segments[2].SetValue(Math.trunc(rval / 10));
        // this._segments[3].SetValue(rval % 10);

        this._display.text = lval + ":" + rval;
    }
}