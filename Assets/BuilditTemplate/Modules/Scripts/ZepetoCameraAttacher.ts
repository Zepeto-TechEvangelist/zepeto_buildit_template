import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Canvas, Camera } from 'UnityEngine';

export default class ZepetoCameraAttacher extends ZepetoScriptBehaviour {

    public canvas: Canvas;
    
    Awake() {
        
        this.canvas ??= this.GetComponent<Canvas>();
        
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            
            this.canvas.worldCamera = ZepetoPlayers.instance.ZepetoCamera.camera;
        });
    }


    // private UpdateCanvasRotation() {
    //     this._canvas.transform.LookAt(this._cachedWorldCamera.transform);
    //     this._canvas.transform.Rotate(0, 180, 0);
    // }
}