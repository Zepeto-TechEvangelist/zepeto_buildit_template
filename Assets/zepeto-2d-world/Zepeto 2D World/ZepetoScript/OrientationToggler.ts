// Assets/Scripts/UI/OrientationToggler.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Button, CanvasScaler, LayoutRebuilder } from 'UnityEngine.UI';
import {
    Screen, Rect, RectTransform, Vector2, GameObject,
    WaitForEndOfFrame, WaitForSeconds, Canvas, Coroutine
} from 'UnityEngine';

export default class OrientationToggler extends ZepetoScriptBehaviour {

    public toggleButton: Button | null = null;
    public safeAreaRoot: RectTransform | null = null;
    public canvasScalerObj: GameObject | null = null;

    public portraitRefResolution: Vector2 = new Vector2(750, 1334);
    public landscapeRefResolution: Vector2 = new Vector2(1334, 750);

    public simulateInEditor: boolean = true;
    public startPortrait: boolean = false;

    private _isPortrait: boolean = false;
    private _canvasScaler: any = null; // CanvasScaler
    private _applyCo: Coroutine | null = null;

    Awake() {
        if (this.toggleButton) this.toggleButton.onClick.AddListener(() => this.Toggle());
        if (this.canvasScalerObj) this._canvasScaler = this.canvasScalerObj.GetComponent<CanvasScaler>();
        if (!this._canvasScaler) console.warn("[OrientationToggler] CanvasScaler not found on canvasScalerObj");
    }

    Start() {
        this._isPortrait = this.startPortrait;
        this.ApplyFixedOrientation(this._isPortrait);
    }

    public Toggle() {
        this._isPortrait = !this._isPortrait;
        this.ApplyFixedOrientation(this._isPortrait);
    }

    private ApplyFixedOrientation(portrait: boolean) {
        // 1) 그냥 방향만 고정
        Screen.orientation = (portrait ? 1 : 3) as any;

        // 2) Scaler 교체
        if (this._canvasScaler) {
            this._canvasScaler.referenceResolution = portrait
                ? this.portraitRefResolution
                : this.landscapeRefResolution;
        }

        // 3) SafeArea 갱신 (레이아웃 강제 리빌드 제거)
        this.ApplySafeArea(this.safeAreaRoot);
    }

    private *DelayedSafeAreaAndLayout() {
        yield new WaitForEndOfFrame();
        yield new WaitForEndOfFrame();
        yield new WaitForSeconds(0.01);
        this.ApplySafeArea(this.safeAreaRoot);
        this.ForceLayoutRebuild(this.safeAreaRoot);
    }

    private ApplySafeArea(root: RectTransform | null) {
        if (!root) return;

        const sa: Rect = Screen.safeArea;
        if (!sa) return;
        
        const parent = root.parent as RectTransform;
        if (!parent) return;

        const parentRect = parent.rect;
        if (!parentRect) return;

        const pw = parentRect.width;
        const ph = parentRect.height;

        const sx = pw > 0 ? sa.x / Screen.width : 0;
        const sy = ph > 0 ? sa.y / Screen.height : 0;
        const sw = pw > 0 ? (sa.x + sa.width) / Screen.width : 1;
        const sh = ph > 0 ? (sa.y + sa.height) / Screen.height : 1;

        root.anchorMin = new Vector2(sx, sy);
        root.anchorMax = new Vector2(sw, sh);
        root.offsetMin = new Vector2(0, 0);
        root.offsetMax = new Vector2(0, 0);
    }

    private ForceLayoutRebuild(root: RectTransform | null) {
        Canvas.ForceUpdateCanvases();
        if (root) {
            LayoutRebuilder.ForceRebuildLayoutImmediate(root);
            for (let i = 0; i < root.childCount; i++) {
                const c = root.GetChild(i) as RectTransform;
                LayoutRebuilder.ForceRebuildLayoutImmediate(c);
            }
        }
        Canvas.ForceUpdateCanvases();
    }
}