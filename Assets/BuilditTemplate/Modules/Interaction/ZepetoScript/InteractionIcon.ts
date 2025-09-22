import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import { Camera, Canvas, Collider, GameObject, Transform, Object } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { UnityEvent } from "UnityEngine.Events";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";


export default class InteractionIcon extends ZepetoScriptBehaviour {
    /* Icon */
    @Header("[Icon]")
    @SerializeField() private prefIconCanvas: GameObject;
    @SerializeField() private iconPosition: Transform;
    
    /* Unity Event */    
    //@Header("[Unity Event]")
    @HideInInspector()
    public OnClickEvent: UnityEvent;
    
    private OnTriggerEnterEvent: UnityEvent;
    private OnTriggerExitEvent: UnityEvent;

    private _button: Button;
    private _canvas: Canvas;    
    private _cachedWorldCamera : Camera;
    private _isIconActive : boolean = false;
    private _isDoneFirstTrig : boolean = false;
    
    public static allInstances: InteractionIcon[] = [];
    public static interactionEnabled: boolean = true;
    
    private Update(){
        if(this._isDoneFirstTrig && this._canvas?.gameObject.activeSelf)
            this.UpdateIconRotation();
    }
    
    private OnTriggerEnter(coll: Collider) {
        if(coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()){
            return;
        }
        
        this.ShowIcon();
        this.OnTriggerEnterEvent?.Invoke();
    }

    private OnTriggerExit(coll: Collider) {
        if(coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()){
            return;
        }
        
        this.HideIcon();
        this.OnTriggerExitEvent?.Invoke();
    }
    
    public ShowIcon(){
        if (InteractionIcon.interactionEnabled == false)
            return;
            
            if(!this._isDoneFirstTrig){
            this.CreateIcon();
            this._isDoneFirstTrig = true;
        }
        else
            this._canvas.gameObject.SetActive(true);
        this._isIconActive = true;
    }
    
    public HideIcon(){
        this._canvas?.gameObject.SetActive(false);
        this._isIconActive = false;
    }

    private CreateIcon(){
        if (this._canvas === undefined) {
            const canvas = GameObject.Instantiate(this.prefIconCanvas, this.iconPosition) as GameObject;
            this._canvas = canvas.GetComponent<Canvas>();
            this._button = canvas.GetComponentInChildren<Button>();
            this._canvas.transform.position = this.iconPosition.position;
        }
        this._cachedWorldCamera ??= ZepetoPlayers.instance.ZepetoCamera.camera;
        this._canvas.worldCamera = this._cachedWorldCamera;

        this._button.onClick.AddListener(()=> {
            if (InteractionIcon.interactionEnabled)
                this.OnClickIcon();
        });
        
        InteractionIcon.allInstances.push(this);
    }
    
    private UpdateIconRotation() {
        this._canvas.transform.LookAt(this._cachedWorldCamera.transform);
    }

    private OnClickIcon() {
        this.OnClickEvent?.Invoke();
    }
    
    Destroy() {
        const index = InteractionIcon.allInstances.indexOf(this);
        InteractionIcon.allInstances.splice(index, 1);
    }
}