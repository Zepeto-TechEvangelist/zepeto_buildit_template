import {ZepetoScriptBehaviour, ZepetoScriptBehaviourComponent} from "ZEPETO.Script";
import { Camera, Canvas, GameObject, Transform, Object, Quaternion, Vector3 } from "UnityEngine";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";

export default class WorldSpaceCanvas extends ZepetoScriptBehaviour {
    
    public stabilizeRotation: bool = true;
    public useLateUpdate: bool = true;
    
    public followTransform: Transform;
    public positionOffset: Vector3;
    
    // Required
    private _canvas: Canvas;
    private _camera : Camera;
    private _isInitialized : boolean = false;

    Start() {
        this.Initialize();
    }

    private Update(){
        if (!this.useLateUpdate)
            this.UpdateIconRotation();
    }
    
    private LateUpdate() {
        if (this.useLateUpdate)
            this.UpdateIconRotation();
    }

    private Initialize(){
        if (this._canvas) return;
        
        this._canvas = this.GetComponent<Canvas>();

        this._camera ??= ZepetoPlayers.instance.ZepetoCamera.camera;
        this._canvas.worldCamera = this._camera;

        this._isInitialized = true;
    }

    private UpdateIconRotation() {
        if (!this._isInitialized) 
            return;
        
        let transform = this._canvas.transform;
        
        transform.position = Vector3.op_Addition(this.followTransform.position, this.positionOffset);
        
        transform.LookAt(this._camera.transform);

        if (this.stabilizeRotation) {
            let angles = transform.rotation.eulerAngles;
            this._canvas.transform.rotation = Quaternion.Euler(angles.x, angles.y, 0);
        }
    }
}