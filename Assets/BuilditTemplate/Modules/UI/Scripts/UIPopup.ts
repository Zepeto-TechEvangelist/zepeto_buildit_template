import {Canvas, RectTransform, Transform, Vector2, Vector3, Quaternion } from 'UnityEngine';
import {Button, LayoutRebuilder, Text} from 'UnityEngine.UI';
import {UnityEvent, UnityAction} from "UnityEngine.Events";
import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {Axis} from "UnityEngine.RectTransform";
import { RoundedRectangleButton, ZepetoText } from 'ZEPETO.World.Gui';
import { UIBase } from './UI';


export default class UIPopup extends UIBase {

    public hidesActionButton: boolean = false;
    
    public hidesCancelButton: boolean = true;
    
    
    @Header("Popup Components")
    
    @SerializeField() protected _title: Text;
    public get title(): Text { return this._title }

    @SerializeField() protected _message: ZepetoText;
    public get message(): ZepetoText { return this._message }

    @SerializeField() protected _actionButton: RoundedRectangleButton;
    public get actionButton(): RoundedRectangleButton { return this._actionButton }

    @SerializeField() protected _cancelButton: RoundedRectangleButton;
    public get cancelButton(): RoundedRectangleButton { return this._cancelButton }
    
    protected OnInitUI() {
        if (this.isInitialized) return;
        
        this.actionButton.gameObject.SetActive(!this.hidesActionButton);
        this.actionButton.OnClick.AddListener(() => this.OnAction());
        
        this.cancelButton.gameObject.SetActive(!this.hidesCancelButton);
        this.cancelButton.OnClick.AddListener(() => this.OnCancel());
        
        super.OnInitUI();
    }

    /**
     * Action button click
     */
    protected OnAction() {
        this.Hide();
    }

    /**
     * Cancel button click
     */
    protected OnCancel() {
        this.Hide();
    }
    
}