import {
    Canvas,
    RectTransform,
    Transform,
    Vector2,
    Vector3,
    Quaternion,
    Coroutine,
    WaitUntil,
    Texture2D
} from 'UnityEngine';
import {Button, LayoutRebuilder, RawImage, Text} from 'UnityEngine.UI';
import {UnityEvent, UnityAction} from "UnityEngine.Events";
import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {Axis} from "UnityEngine.RectTransform";
import {RoundedRectangle, RoundedRectangleButton} from 'ZEPETO.World.Gui';
import {Item} from "ZEPETO.Module.Content";
import {ZepetoPropertyFlag} from "Zepeto";


export class UIBase extends ZepetoScriptBehaviour {

    @Header("Base")

    public showOnAwake: boolean = false;

    public isVisible: boolean = false;

    public blockTouches: boolean = false;

    public fitContent: boolean = true;

    public enableCloseOnTouch: boolean = false;

    public hidesCloseButton: boolean = true;

    @SerializeField() protected _canvas: Canvas;
    public get canvas(): Canvas { return this._canvas }

    @SerializeField() protected _container: RectTransform;
    public get container(): RectTransform { return this._container }

    @SerializeField() protected _content: RectTransform;
    public get content(): RectTransform { return this._content }

    @SerializeField() protected _header: RectTransform;
    public get header(): RectTransform { return this._header }

    @SerializeField() protected _footer: RectTransform;
    public get footer(): RectTransform { return this._footer }

    @SerializeField() protected _closeButton: Button;
    public get closeButton(): Button { return this._closeButton }

    /** -------------------------------------------------------------------------------------------------------- */

        // TODO: consider converting UnityEvent > ZepetoEvent
    protected onOpenEvent: UnityEvent;
    public get onOpened(): UnityEvent { this.onOpenEvent ??= new UnityEvent(); return this.onOpenEvent; }

    protected onCloseEvent: UnityEvent;
    public get onClosed(): UnityEvent { this.onCloseEvent ??= new UnityEvent(); return this.onCloseEvent; }

    protected _initialized: boolean;
    public get isInitialized(): boolean { return this._initialized }

    protected Awake() {
        this.OnInitUI();
    }

    protected OnInitUI() {
        if (this.isInitialized) return;
        this._initialized = true;

        if (this.fitContent) {
            this.RebuildLayout();
        }

        this.closeButton.gameObject.SetActive(!this.hidesCloseButton);
        this.closeButton.onClick.AddListener(() => { this.Hide() });
        
        if (this.showOnAwake) {
            this.Show();
        }
        else {
            this.Hide();
        }
    }

    /**
     * Recalculate bounds and layout elements
     */
    public RebuildLayout() {
        LayoutRebuilder.ForceRebuildLayoutImmediate(this.content);
    }

    /**
     * Show the UI
     */
    public Show() {
        
        if (!this.gameObject.activeInHierarchy)
            this.gameObject.SetActive(true);
        else if (this.isVisible) 
            return;
        
        this.isVisible = true;
        this.canvas.enabled = true;
        
        this.onOpenEvent?.Invoke();
    }

    /**
     * Hide the UI
     */
    public Hide() {

        // if (!this.gameObject.activeInHierarchy)
        //     this.gameObject.SetActive(true);
        // else if (this.isVisible)
        //     return;
        
        // if (!this.isVisible) return;
        this.isVisible = false;

        this.canvas.enabled = false;
        this.gameObject.SetActive(false);

        this.onCloseEvent?.Invoke();
    }
    
    private SetVisible(visible: boolean) {
        this.canvas.enabled = visible;
    }

}


// TODO: some content later


