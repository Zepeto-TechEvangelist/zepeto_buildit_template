import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Button, Image, Shadow} from "UnityEngine.UI";
import {Canvas, GameObject, Transform, Sprite, Color} from "UnityEngine";
import { UnityEvent } from "UnityEngine.Events";
import {ZepetoText} from "ZEPETO.World.Gui";

export default class PopupController extends ZepetoScriptBehaviour {

    @Header("[Custom Properties]")
    // public title: string;
    @Tooltip("Graphic shown as background image, needs to be a Sprite type")
    public backgroundImage: Sprite;
    @Tooltip("String for the message shown above the button")
    public message: string;
    @Tooltip("Text color for the message")
    public messageColor: Color;
    @Tooltip("Enable/Disable shadow of the message text")
    public messageShadow: boolean;
    @Tooltip("Caption of the button")
    public buttonTitle: string;
    
    @Header("[Connections - do not edit]")
    @SerializeField() private _canvas: Canvas;
    @SerializeField() private _background: Image;
    @SerializeField() private _button: Button;
    @SerializeField() private _text: ZepetoText;
    // @HideInInspector() public OnClickEvent: UnityEvent;
    
    Start() {
        
        this._background.sprite = this.backgroundImage;
        
        this._text.text = this.message;
        this._text.color = this.messageColor;
        this._text.GetComponent<Shadow>().enabled = this.messageShadow;
        
        this._button.gameObject.GetComponentInChildren<ZepetoText>().text = this.buttonTitle;
        
        this._button.onClick.AddListener(()=>{
            this._canvas.gameObject.SetActive(false);
        });
    }


    OnBeforeSerialize() {
        console.log("On Before Serialize");
        // this.messageShadow = false;
    }

    OnAfterDeserialize() {
        console.log("On After Deserialize");

        this._background.sprite = this.backgroundImage;

        this._text.text = this.message;
        this._text.color = this.messageColor;
        this._text.GetComponent<Shadow>().enabled = this.messageShadow;

        this._button.gameObject.GetComponentInChildren<ZepetoText>().text = this.buttonTitle;
    }
    
    Validate() {
        console.log("Validate");
    }
    
    OnEnable() {
        console.log("On Enable");
    }

    Update() {
        console.log("Update");
    }
    
    //enum Events { None = 0, Awake = 1, OnEnable = 2, Start = 4, FixedUpdate = 8, Update = 16, LateUpdate = 32, OnDisable = 64, OnDestroy = 128, OnCollisionEnter = 256, OnCollisionExit = 257, OnCollisionStay = 258, OnCollisionEnter2D = 272, OnCollisionExit2D = 273, OnCollisionStay2D = 274, OnTriggerEnter = 512, OnTriggerExit = 513, OnTriggerStay = 514, OnTriggerEnter2D = 528, OnTriggerExit2D = 529, OnTriggerStay2D = 530, OnControllerColliderHit = 768, OnGUI = 65536, OnMouseDown = 196608, OnMouseDrag = 196609, OnMouseUp = 196610, OnMouseEnter = 196611, OnMouseExit = 196612, OnMouseOver = 196613, OnMouseUpAsButton = 196614, OnApplicationFocus = 131072, OnApplicationPause = 262144, OnApplicationQuit = 524288, OnPreRender = 1048576, OnPostRender = 1048577, OnRenderImage = 1048578, OnRenderObject = 1048579, OnWillRenderObject = 1048580, OnPreCull = 1048581, OnAnimatorIK = 2097152, OnAnimatorMove = 2097153, OnDrawGizmos = 3145728, OnOpenedHome = 16777216, OnClosedHome = 33554432 }
    //     
}
