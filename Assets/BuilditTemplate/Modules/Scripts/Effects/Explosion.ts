import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Transform, Vector3, Time } from 'UnityEngine';

export default class Explosion extends ZepetoScriptBehaviour {

    public duration: number;
    public size: number;
    
    private _initialScale: Vector3;
    private _triggered: boolean = false;
    private _expiredTime: number = 0;
    
    Start() {
        const speed = this.size / this.duration;
        
        this._triggered = true;
        this._initialScale = this.transform.localScale;
    }
    
    Update() {
        if (!this._triggered) return;
        
        this._expiredTime += Time.deltaTime;
        
        this.transform.localScale = Vector3.Lerp(this._initialScale, this._initialScale * this.size, this._expiredTime / this.duration);
        
        if (this.duration <= this._expiredTime) {
            this.gameObject.SetActive(false);
        }
    }
}