import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { Camera, Canvas, Collider, GameObject, Transform, Object } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { UnityEvent } from "UnityEngine.Events";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import AdvertisementManager from "./AdvertisementManager";
import PlayerTrigger, { IPlayerTrigger } from "../Scripts/PlayerTrigger";
import { ZepetoEvent, ZepetoEvent1 } from "../Scripts/Utility/ZepetoEvent";

export default class AdvertisementController extends ZepetoScriptBehaviour implements IPlayerTrigger {

    public destination: Transform;

    @SerializeField() private prefIconCanvas: GameObject;
    @SerializeField() private iconPosition: Transform;

    private _button: Button;
    private _canvas: Canvas;
    private _cachedWorldCamera: Camera;
    private _isIconActive: boolean = false;
    private _isDoneFirstTrig: boolean = false;

    @HideInInspector() public OnClickEvent: UnityEvent;
    
    private _adViewEvent: ZepetoEvent = new ZepetoEvent();
    public get OnViewAdEvent(): ZepetoEvent { return this._adViewEvent }
    
    
    Start() {
        
        let trigger = this.GetComponentInChildren<PlayerTrigger>();
        if (trigger)
            trigger.delegate = this;
        
        if (this.destination) {
            this.OnViewAdEvent.add_handler(() => {
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.Teleport(this.destination.position, this.destination.rotation);
            });
        }
    }
    
    OnPlayerEnter() {
        this.ShowIcon();
    }
    
    OnPlayerExit() {
        this.HideIcon();
    }
    
    // Obsolete code
    private OnTriggerEnter(coll: Collider) {
        if (coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }

        this.ShowIcon();
    }

    private OnTriggerExit(coll: Collider) {
        if (coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }

        this.HideIcon();
    }

    public ShowIcon() {
        if (AdvertisementController.interactionEnabled == false)
            return;
        
        if (!this._isDoneFirstTrig) {
            this.CreateIcon();
            this._isDoneFirstTrig = true;
        }
        else
            this._canvas.gameObject.SetActive(true);
        
        this._isIconActive = true;
    }

    public HideIcon() {
        this._canvas?.gameObject.SetActive(false);
        this._isIconActive = false;
    }

    private CreateIcon() {
        if (this._canvas === undefined) {
            const canvas = GameObject.Instantiate(this.prefIconCanvas, this.iconPosition) as GameObject;
            this._canvas = canvas.GetComponent<Canvas>();
            this._button = canvas.GetComponentInChildren<Button>();
            this._canvas.transform.position = this.iconPosition.position;
        }
        this._cachedWorldCamera ??= ZepetoPlayers.instance.ZepetoCamera.camera;
        this._canvas.worldCamera = this._cachedWorldCamera;

        this._button.onClick.AddListener(() => {
            
            if (AdvertisementController.interactionEnabled == false)
                return;
            
            // Debug
            // this.OnViewAdEvent?.Invoke();

            // Release
            AdvertisementManager.Instance.ShowAd(() => {
               this.OnViewAdEvent?.Invoke(); 
            });
        });

        AdvertisementController.allInstances.push(this);
    }

    private UpdateIconRotation() {
        this._canvas.transform.LookAt(this._cachedWorldCamera.transform);
    }
    
    private Update() {
        if (this._isDoneFirstTrig && this._canvas?.gameObject.activeSelf)
            this.UpdateIconRotation();
    }

    public static allInstances: AdvertisementController[] = [];
    public static interactionEnabled: boolean = true;
    
    Destroy() {
        const index = AdvertisementController.allInstances.indexOf(this);
        AdvertisementController.allInstances.splice(index, 1);
    }
    
}