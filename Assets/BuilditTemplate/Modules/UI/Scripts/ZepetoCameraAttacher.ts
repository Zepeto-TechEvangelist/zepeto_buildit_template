import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Canvas, Camera } from 'UnityEngine';

export default class ZepetoCameraAttacher extends ZepetoScriptBehaviour {

    /**
     * The canvas to be attached to
     */
    public canvas: Canvas;

    /**
     * Should the canvas be always front-facing towards the player camera
     */
    public followPlayer: boolean;
    
    
    private _camera: Camera;
    
    Start() {
        
        this.canvas ??= this.GetComponent<Canvas>();
        
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._camera = ZepetoPlayers.instance.ZepetoCamera.camera;
            this.canvas.worldCamera = this._camera;
        });
    }
    
    Update() {
        if (this._camera && this.followPlayer) {
            this.canvas.transform.LookAt(this._camera.transform);
            this.canvas.transform.Rotate(0, 180, 0);
        }
    }
    
}