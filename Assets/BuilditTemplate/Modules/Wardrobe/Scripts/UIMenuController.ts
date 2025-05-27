import {Canvas, RectTransform, Transform, Vector2, Vector3, Quaternion } from 'UnityEngine';
import {Button, LayoutRebuilder, Text} from 'UnityEngine.UI';
import {UnityEvent} from "UnityEngine.Events";
import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {Axis} from "UnityEngine.RectTransform";
import {ZepetoPlayers, ZepetoCamera} from "ZEPETO.Character.Controller";


export default class UIMenuController extends ZepetoScriptBehaviour {
    
    public root: Transform;
    public closeButton: Button;
    public titleText: Text;
    public titlePanel: RectTransform;
    public panelRect: RectTransform;
    public direction: Direction = Direction.Left; 
    
    private readonly _touchBlockDelay = 0.5;
    private _menuVisible: boolean = false;
    // private readonly _panelScreenInfo = {
    //     landscape: { posX: -132, top: 204, bottom: 280 },
    //     portrait: { posX: -20, top: 537, bottom: 548 },
    // } as ScreenInfo;

    private readonly _directionScreen = {
        left: { l: 0, r: 0, t: 0, b: 0, w: 340, h:0, pivot: { x: 0, y: 0.5 }, anchors: Anchors.left, offset: { x: 1, y: 0, z: 0 } },
        right: { l: 0, r: -20, t: 20, b: 20, w: 340, h: 0, pivot: { x: 1, y: 0.5 }, anchors: Anchors.right, offset: { x: -1, y: 0, z: 0 } },
        bottom: { l: 0, r: 0, t: 0, b: 0, w: 0, h: 400, pivot: { x: 0, y: 0 }, anchors: Anchors.bottom, offset: { x: 0, y: -1, z: 0 } },
    }
    
    public cameraOffsetAdjustment: Vector3;
    
    public open: UnityEvent;
    public close: UnityEvent;
    public get onOpened(): UnityEvent { this.open ??= new UnityEvent(); return this.open; }
    public get onClosed(): UnityEvent { this.close ??= new UnityEvent(); return this.close; }


    private savedCameraOffset: Vector3;
    
    public get menuVisible(): boolean { 
        return this._menuVisible; 
    }

    
    protected Awake() {
        this.OnInitUI();
    }
    
    protected OnInitUI() {

        let rect;
        switch (this.direction) {
            case Direction.Left:
                rect = this._directionScreen.left;
                break;
            case Direction.Right:
                rect = this._directionScreen.right;
                break;
            case Direction.Bottom:
                rect = this._directionScreen.bottom;
                break;
        }
        
        this.panelRect.anchorMin = new Vector2(rect.anchors.min.x, rect.anchors.min.y);
        this.panelRect.anchorMax = new Vector2(rect.anchors.max.x, rect.anchors.max.y);
        this.panelRect.pivot = new Vector2(rect.pivot.x, rect.pivot.y);
       // this.panelRect.sizeDelta = new Vector2(rect.w, rect.h);
        this.panelRect.offsetMin = new Vector2(rect.l, rect.t);
        this.panelRect.offsetMax = new Vector2(rect.r, -rect.b);

        if (rect.h != 0)
            this.panelRect.SetSizeWithCurrentAnchors(Axis.Vertical, rect.h);
        if (rect.w != 0)
            this.panelRect.SetSizeWithCurrentAnchors(Axis.Horizontal, rect.w);

        
        this.cameraOffsetAdjustment = Vector3.op_Multiply(new Vector3(rect.offset.x, rect.offset.y, rect.offset.z), 0.5);
    }

    protected OnShowUI() {
    }

    // protected OnChangeScreenMode() {
    //     this.ChangeRectByScreenMode(mode, this.panelRect, this._panelScreenInfo);
    // }

    protected OnHideUI(isFromInit?: boolean) {
    }

    protected IsEnableShow(): boolean {
        return true;
    }

    protected IsEnableHide(): boolean {
        return true;
    }

    public ToggleMenu() {
        this._menuVisible ? this.Hide() : this.ShowMenu(); 
    }
    
    public Hide() {
        
        this.GetComponent<Canvas>().enabled = false;
        this._menuVisible = false;

        ZepetoPlayers.instance.ZepetoCamera.additionalOffset = this.savedCameraOffset;

        this.close?.Invoke();
    }

    public ShowMenu() {
        if (this._menuVisible) return;
        this._menuVisible = true;
        
        this.GetComponent<Canvas>().enabled = true;
        
        this.closeButton?.onClick.RemoveAllListeners();
        this.closeButton?.onClick.AddListener(() => this.Hide());

        // if (titleKey) {
        //     this.titleText.text = titleKey; // TODO: Localize
        // } else {
        //     this.titleText.text = "";
        // }
        this.savedCameraOffset = ZepetoPlayers.instance.ZepetoCamera.additionalOffset;
        // TODO: lock zoom
        
        // Logic for moving the character
        // let forwardAngle = ZepetoPlayers.instance.ZepetoCamera.cameraParent.transform.localEulerAngles.y - 180;  // 180 is zero state angle
        // let v = Quaternion.AngleAxis(forwardAngle, Vector3.up) * this.cameraOffsetAdjustment;
        // ZepetoPlayers.instance.ZepetoCamera.additionalOffset = v;


        this.open?.Invoke();
        
        //this._isVisible = true;

        // this.StartCoroutine(this.SetTitlePanelPosition());
        // this.StartCoroutine(this.SetTouchDetection());
    }

    // public HideList(isHidingForSequenceExecution: boolean) {
    //     if (!this.isVisible) {
    //         return;
    //     }
    //     this._isShowingList = false;
    //     this._listClosed.Invoke(isHidingForSequenceExecution);
    //     this.Hide();
    // }
    //
    // private *SetTitlePanelPosition() {
    //     yield WaitPool.endOfFrame;
    //
    //     const topItemPosY: number = this._itemInstances[0].gameObject.GetComponent<RectTransform>().anchoredPosition.y;
    //     const titlePanelPosY: number = topItemPosY + 70; // 최상단 아이템과 타이틀 사이의 간격
    //     this.titlePanel.anchoredPosition = new Vector2(this.titlePanel.anchoredPosition.x, titlePanelPosY);
    // }

    // private *SetTouchDetection() {
    //     yield WaitPool.Seconds(this._touchBlockDelay);
    //     while (this.isVisible) {
    //         if (Input.touchCount > 0 && Input.GetTouch(0).phase === TouchPhase.Began) {
    //             if (!this._uiManager.CheckHitUILayer(Input.GetTouch(0).position)) {
    //                 this.Hide();
    //             }
    //         }
    //         yield null;
    //     }
    // }
    //
    // private UpdateListItem(item: UIListInteractionItem, info: ListInteractionInfo) {
    //     NewWorldBase.localization.ApplyLocalization(item.text, info.text);
    //     item.icon.sprite = info.icon;
    //     if (info.badge != null) {
    //         item.badge.sprite = info.badge;
    //         item.badge.gameObject.SetActive(true);
    //     } else {
    //         item.badge.gameObject.SetActive(false);
    //     }
    //     item.mainButton.onClick.RemoveAllListeners();
    //     if (info.isActive) {
    //         item.canvasGroup.alpha = 1;
    //         item.mainButton.onClick.AddListener(() => {
    //             info.callback();
    //             this.HideList(true);
    //         });
    //     } else {
    //         item.canvasGroup.alpha = 0.5;
    //     }
    // }


    
}

export enum Direction {
    Left,
    Bottom,
    Right,
    Top
}

const Anchors = {
    left: {
        min : { x: 0, y: 0 },
        max: { x: 0, y: 1 }
    },
    right: {
        min : { x: 1, y: 0 },
        max: { x: 1, y: 1 }
    },
    bottom: {
        min : { x: 0, y: 0 },
        max: { x: 1, y: 0 }
    },
    top: {
        min : { x: 0, y: 1 },
        max: { x: 1, y: 1 }
    }
}


interface Vec2 {
    x: number, 
    y: number
}

interface Anchor {
    min : Vec2,
    max: Vec2
}

interface Rect {
    l: number, r: number, t: number, b: number, w: number, h: number, 
    pivot: Vec2, 
    anchors: Anchor
}

// RectTransform rectTransform;
//
// /*Left*/ rectTransform.offsetMin.x;
// /*Right*/ rectTransform.offsetMax.x;
// /*Top*/ rectTransform.offsetMax.y;
// /*Bottom*/ rectTransform.offsetMin.y;

// public static class RectTransformExtensions
// {
//     public static RectTransform Left( this RectTransform rt, float x )
// {
//     rt.offsetMin = new Vector2( x, rt.offsetMin.y );
//     return rt;
// }
//
// public static RectTransform Right( this RectTransform rt, float x )
// {
//     rt.offsetMax = new Vector2( -x, rt.offsetMax.y );
//     return rt;
// }
//
// public static RectTransform Bottom( this RectTransform rt, float y )
// {
//     rt.offsetMin = new Vector2( rt.offsetMin.x, y );
//     return rt;
// }
//
// public static RectTransform Top( this RectTransform rt, float y )
// {
//     rt.offsetMax = new Vector2( rt.offsetMax.x, -y );
//     return rt;
// }
// }