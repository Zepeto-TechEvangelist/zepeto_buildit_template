import { FXBase } from './FXBase';
import { Vector3 } from 'UnityEngine';

export default class ScaleTransformFX extends FXBase {
    
    public scale: float;
    
    private _initialScale: Vector3;
    
    protected Initialize() {
        this._initialScale = this.transform.localScale;
    }
    
    protected Prepare() {
        
    }
    
    protected TimeFunction() {
        this.transform.localScale = Vector3.Lerp(this._initialScale, this._initialScale * this.scale, this.progress);
    }
    
    protected Finish() {
        
    }
    
}