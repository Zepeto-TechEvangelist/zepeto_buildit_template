import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Button, Image} from "UnityEngine.UI";
import {Canvas, GameObject, Transform, Sprite} from "UnityEngine";
import { UnityEvent } from "UnityEngine.Events";
import {ZepetoText} from "ZEPETO.World.Gui";

export default class PopupController extends ZepetoScriptBehaviour {

    @Header("[Customization]")
    // public title: string;
    public backgroundImage: Sprite;
    public message: string;
    public buttonTitle: string;

    @Header("[Connections]")
    @SerializeField() private _canvas: Canvas;
    @SerializeField() private _background: Image;
    @SerializeField() private _button: Button;
    @SerializeField() private _text: ZepetoText;
    // @HideInInspector() public OnClickEvent: UnityEvent;
    
    Start() {
        
        this._background.sprite = this.backgroundImage;
        this._text.text = this.message;
        this._button.gameObject.GetComponentInChildren<ZepetoText>().text = this.buttonTitle;
        
        this._button.onClick.AddListener(()=>{
            this._canvas.gameObject.SetActive(false);
        });
    }

}
