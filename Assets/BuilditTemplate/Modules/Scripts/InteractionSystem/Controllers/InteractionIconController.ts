import {ZepetoScriptBehaviour, ZepetoScriptBehaviourComponent} from "ZEPETO.Script";
import { Camera, Canvas, Collider, GameObject, Transform, Object } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { UnityAction } from "UnityEngine.Events";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import PlayerTrigger from "../../PlayerTrigger";

export default class InteractionIconController extends ZepetoScriptBehaviour {
    /* Icon */
    @Header("[Icon]")
    @SerializeField() private iconPrefab: GameObject;
    @SerializeField() private iconPosition: Transform;

    /* Unity Event */
    @Header("[ZepetoScript Event]")
    public scriptObject: ZepetoScriptBehaviourComponent;
    public functionName: string;
    
    private _canvas: Canvas;
    private _camera : Camera;
    private _isIconActive : boolean = false;

    public static allInstances: InteractionIconController[] = [];
    public static interactionEnabled: boolean = true;
    
    Start() {
        const trigger = this.GetComponent<PlayerTrigger>() ?? this.GetComponentInChildren<PlayerTrigger>();
        trigger.OnPlayerEnter.AddListener( (character) => { this.ShowIcon() } );
        trigger.OnPlayerExit.AddListener( (character) => { this.HideIcon() } );
    }
    
    private Update(){
         this.UpdateIconRotation();
    }
    

    public ShowIcon(){
        if (InteractionIconController.interactionEnabled == false || this._isIconActive) return;
        
        this.CreateIcon();
        if (this._canvas)
            this._canvas.gameObject.SetActive(true);
        this._isIconActive = true;
    }

    public HideIcon(){
        if (!this._isIconActive) return;
        if (this._canvas)
            this._canvas.gameObject.SetActive(false);
        this._isIconActive = false;
    }

    private CreateIcon(){
        if (this._canvas) return;

        const instance = GameObject.Instantiate(this.iconPrefab, this.iconPosition) as GameObject;
        this._canvas = instance.GetComponent<Canvas>();
        
        this._canvas.transform.position = this.iconPosition.position;
        this._camera ??= ZepetoPlayers.instance.ZepetoCamera.camera;
        this._canvas.worldCamera = this._camera;

        const button = instance.GetComponentInChildren<Button>();
        button.onClick.AddListener(() => {
            if (InteractionIconController.interactionEnabled)
                this.scriptObject.Invoke(this.functionName);
        });

        InteractionIconController.allInstances.push(this);
    }

    private UpdateIconRotation() {
        if (!this._isIconActive) return;
        this._canvas.transform.LookAt(this._camera.transform);
    }
}