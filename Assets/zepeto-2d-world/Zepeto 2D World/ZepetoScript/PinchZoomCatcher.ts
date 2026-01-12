// Assets/Scripts/UI/PinchZoomCatcher.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    Vector2, Vector3, Mathf, GameObject, Time, Physics2D, Physics, Camera, RaycastHit, Collider2D, Collider, Transform, CanvasGroup
} from 'UnityEngine';
import {
    IPointerDownHandler, IPointerUpHandler, IDragHandler,
    PointerEventData, EventTrigger, EventTriggerType
} from 'UnityEngine.EventSystems';
import { Entry } from 'UnityEngine.EventSystems.EventTrigger';
import { TextMeshProUGUI } from 'TMPro';
import CameraFollow2D from './CameraFollow2D';
import Player2DHandle from './Player2DHandle';
import Zepeto2DPlayer from './Zepeto2DPlayer';
import Zepeto2DWorldManager from './Zepeto2DWorldManager';
declare const require: any;
const SocialModule: any = require('ZEPETO.Module.Social');

/**
 * Captures two-finger pinch gestures on a UI element and forwards zoom deltas to CameraFollow2D.
 * - Attach this to a full-screen UI panel (with a GraphicRaycaster above).
 * - It will auto-locate or auto-create an EventTrigger on the same GameObject.
 */
export default class PinchZoomCatcher extends ZepetoScriptBehaviour
    implements IPointerDownHandler, IPointerUpHandler, IDragHandler {

    /** Target camera follow (auto-found if not assigned). */
    public cameraFollow: CameraFollow2D | null = null;

    /** Optional debug text (T.M.Pro) to visualize pinch data. */
    public debugText: TextMeshProUGUI | null = null;

    /** Pixels → orthoSize conversion (lower = more sensitive). */
    public pinchSensitivity: number = 0.035;

    /** Max absolute ortho change applied in one frame (higher = smoother at cost of responsiveness). */
    public maxStepPerFrame: number = 1.0;

    // Internal pointer tracking (exactly two fingers)
    private _p0Id: number | null = null;
    private _p1Id: number | null = null;
    private _p0Pos: Vector2 = new Vector2(0, 0);
    private _p1Pos: Vector2 = new Vector2(0, 0);
    private _prevDist: number | null = null;

    private _tapCandidateId: number | null = null;
    private _tapStartPos: Vector2 = new Vector2(0, 0);
    private _tapStartTime: number = 0;
    private readonly _tapMaxDistance: number = 30;
    private readonly _tapMaxDuration: number = 0.25;

    // Debug throttle
    private _nextLogTime: number = 0;
    private _logInterval: number = 0.04; // ~25 fps

    private _canvasGroup: CanvasGroup | null = null;
    private _inputBlocked: boolean = false;
    private _profileCardWasOpen: boolean = false;
    private static _instance: PinchZoomCatcher | null = null;

    public static get instance(): PinchZoomCatcher | null {
        return this._instance;
    }

    Awake() {
        PinchZoomCatcher._instance = this;

        // Resolve camera follow if not wired
        if (!this.cameraFollow) {
            this.cameraFollow = GameObject.FindObjectOfType<CameraFollow2D>() as CameraFollow2D;
        }

        // Ensure there's an EventTrigger on this object and wire handlers
        let trigger = this.gameObject.GetComponent<EventTrigger>();
        if (!trigger) trigger = this.gameObject.AddComponent<EventTrigger>();

        const add = (type: EventTriggerType, cb: (e: PointerEventData) => void) => {
            const entry = new Entry();
            entry.eventID = type;
            entry.callback.AddListener(cb);
            trigger.triggers.Add(entry);
        };

        add(EventTriggerType.PointerDown, (e: PointerEventData) => this.OnPointerDown(e));
        add(EventTriggerType.Drag, (e: PointerEventData) => this.OnDrag(e));
        add(EventTriggerType.PointerUp, (e: PointerEventData) => this.OnPointerUp(e));
        // In case platform fires cancel events:
        add(EventTriggerType.Cancel, (e: PointerEventData) => this.OnPointerUp(e));

        this._canvasGroup = this.GetComponent<CanvasGroup>();
        if (!this._canvasGroup) {
            this._canvasGroup = this.gameObject.AddComponent<CanvasGroup>();
        }
        this.ApplyRaycastState(true);
    }

    OnDisable() {
        // Reset state so we don't carry stale pointers across enable/disable
        this._p0Id = this._p1Id = null;
        this._prevDist = null;
        if (PinchZoomCatcher._instance === this) {
            PinchZoomCatcher._instance = null;
        }
    }

    // --- Pointer logic --------------------------------------------------------

    OnPointerDown(e: PointerEventData) {
        if (this.CloseProfileCardIfOpen()) {
            return;
        }

        if (this._inputBlocked) {
            return;
        }

        if (this._p0Id === null) {
            this._p0Id = e.pointerId;
            this._p0Pos = new Vector2(e.position.x, e.position.y);
            this._tapCandidateId = e.pointerId;
            this._tapStartPos = new Vector2(e.position.x, e.position.y);
            this._tapStartTime = Time.time;
        } else if (this._p1Id === null && e.pointerId !== this._p0Id) {
            this._p1Id = e.pointerId;
            this._p1Pos = new Vector2(e.position.x, e.position.y);
            this._prevDist = Vector2.Distance(this._p0Pos, this._p1Pos);
            this._tapCandidateId = null;
        }
        // this.debugLog("DOWN", e);
    }

    OnDrag(e: PointerEventData) {
        if (this.CloseProfileCardIfOpen()) {
            return;
        }

        if (this._inputBlocked) return;

        // Update whichever finger moved
        if (this._p0Id !== null && e.pointerId === this._p0Id) {
            this._p0Pos = new Vector2(e.position.x, e.position.y);
        } else if (this._p1Id !== null && e.pointerId === this._p1Id) {
            this._p1Pos = new Vector2(e.position.x, e.position.y);
        } else {
            return;
        }

        if (this._tapCandidateId !== null && e.pointerId === this._tapCandidateId) {
            const delta = Vector2.Distance(this._tapStartPos, new Vector2(e.position.x, e.position.y));
            if (delta > this._tapMaxDistance) {
                this._tapCandidateId = null;
            }
        }

        // Only pinch when both are tracked
        if (this._p0Id !== null && this._p1Id !== null) {
            const curDist = Vector2.Distance(this._p0Pos, this._p1Pos);
            if (this._prevDist !== null && this.cameraFollow) {
                // Positive deltaPixels = fingers moved apart (intuitively zoom out)
                // We invert to make “pinch in (closer)” → zoom in (smaller ortho)
                let deltaOrtho = -(curDist - this._prevDist) * this.pinchSensitivity;

                // Clamp per frame to avoid big jumps on low-FPS or large drags
                const cap = Mathf.Max(0.0001, this.maxStepPerFrame);
                deltaOrtho = Mathf.Clamp(deltaOrtho, -cap, +cap);

                this.cameraFollow.ApplyZoomDelta(deltaOrtho);
            }
            this._prevDist = curDist;
        }

        // this.debugLog("DRAG", e);
    }

    OnPointerUp(e: PointerEventData) {
        if (this.CloseProfileCardIfOpen()) {
            return;
        }

        if (this._inputBlocked) return;

        // Release whichever finger went up; reset pinch state
        if (this._p0Id !== null && e.pointerId === this._p0Id) {
            this._p0Id = null;
            this._prevDist = null;
        } else if (this._p1Id !== null && e.pointerId === this._p1Id) {
            this._p1Id = null;
            this._prevDist = null;
        }

        if (this._tapCandidateId !== null && e.pointerId === this._tapCandidateId) {
            const duration = Time.time - this._tapStartTime;
            const delta = Vector2.Distance(this._tapStartPos, new Vector2(e.position.x, e.position.y));
            if (duration <= this._tapMaxDuration && delta <= this._tapMaxDistance && this._p1Id === null) {
                console.log(`[PinchZoomCatcher] Tap detected -> pos=(${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}), duration=${duration.toFixed(3)}, delta=${delta.toFixed(1)}`);
                this.HandleTap(new Vector2(e.position.x, e.position.y));
            }
            this._tapCandidateId = null;
        }
        // this.debugLog("UP", e);
    }

    // --- Optional debug -------------------------------------------------------

    private debugLog(tag: string, e: PointerEventData) {
        if (!this.debugText) return;
        if (tag === "DRAG" && Time.time < this._nextLogTime) return;
        this._nextLogTime = Time.time + this._logInterval;

        const both = (this._p0Id !== null && this._p1Id !== null);
        const dist = both ? Vector2.Distance(this._p0Pos, this._p1Pos).toFixed(1) : "-";
        const delta = (both && this._prevDist !== null)
            ? (Vector2.Distance(this._p0Pos, this._p1Pos) - this._prevDist).toFixed(1)
            : "-";

        this.debugText.text =
            `[#${tag}] pid=${e.pointerId}\n` +
            `p0=${this._p0Id ?? "-"}  pos(${this._p0Pos.x.toFixed(0)}, ${this._p0Pos.y.toFixed(0)})\n` +
            `p1=${this._p1Id ?? "-"}  pos(${this._p1Pos.x.toFixed(0)}, ${this._p1Pos.y.toFixed(0)})\n` +
            `dist=${dist}  delta=${delta}`;
    }

    private HandleTap(screenPos: Vector2) {
        const cam = this.ResolveCamera();
        if (!cam) return;

        const worldPoint = cam.ScreenToWorldPoint(new Vector3(screenPos.x, screenPos.y, cam.nearClipPlane));
        console.log(`[PinchZoomCatcher] Screen tap -> world=(${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}, ${worldPoint.z.toFixed(2)})`);
        const hit2D = Physics2D.OverlapPoint(new Vector2(worldPoint.x, worldPoint.y));
        if (hit2D && this.TryOpenProfileFromCollider2D(hit2D)) {
            return;
        }

        const ray = cam.ScreenPointToRay(new Vector3(screenPos.x, screenPos.y, 0));
        const hitRef = $ref(new RaycastHit());
        if (Physics.Raycast(ray, hitRef)) {
            const hit = $unref(hitRef);
            if (hit) {
                console.log(`[PinchZoomCatcher] Raycast hit -> ${hit.collider?.name ?? 'none'}`);
                if (this.TryOpenProfileFromTransform(hit.collider?.transform)) {
                    return;
                }
            } else {
                console.log(`[PinchZoomCatcher] Raycast miss`);
            }
        } else {
            console.log(`[PinchZoomCatcher] Physics.Raycast returned false.`);
        }
    }

    private TryOpenProfileFromCollider2D(col: Collider2D | null): boolean {
        if (!col) return false;
        const handle = col.GetComponent<Player2DHandle>() as Player2DHandle
            ?? col.GetComponentInParent<Player2DHandle>() as Player2DHandle;
        if (handle && handle.owner) {
            const result = handle.owner.OpenProfileCard();
            console.log(`[PinchZoomCatcher] 2D collider hit ${col.name} -> owner=${handle.owner?.name ?? 'null'}, open=${result}`);
            if (result) {
                return;
            }
        }

        return this.TryOpenProfileFromTransform(col.transform);
    }

    private TryOpenProfileFromTransform(target: Transform | null): boolean {
        if (!target) return false;
        const manager = Zepeto2DWorldManager.Instance;
        const player = manager?.ResolvePlayerFromTransform(target);
        if (!player) {
                console.log(`[PinchZoomCatcher] ResolvePlayerFromTransform -> null`);
            return false;
        }

        const controller = player.character?.GetComponent<Zepeto2DPlayer>() as Zepeto2DPlayer;
        if (controller) {
            return controller.OpenProfileCard();
        }

        const card = SocialModule?.ProfileCard?.instance;
        if (!card) {
            console.warn("[PinchZoomCatcher] ProfileCard instance unavailable.");
            return false;
        }

        const userId = player.userId;
        if (!userId || userId.length === 0) {
            console.warn("[PinchZoomCatcher] Target player missing userId.");
            return false;
        }

        const config = this.CreateProfileCardConfig();
        console.log(`[PinchZoomCatcher] Opening profile card for userId=${userId} (fallback)`);
        try {
            if (typeof card.Open === 'function') {
                card.Open(userId, config);
                return true;
            }
            if (typeof card.open === 'function') {
                card.open(userId, config);
                return true;
            }
        } catch (error) {
            console.error(`[PinchZoomCatcher] Failed to open profile card via fallback: ${error}`);
        }
        return false;
    }

    private CreateProfileCardConfig(): any {
        const ConfigCtor = SocialModule?.ProfileCardConfig;
        if (ConfigCtor) {
            try {
                const config = new ConfigCtor();
                if (typeof config === 'object') {
                    if ('closeOnClickOutside' in config) {
                        config.closeOnClickOutside = true;
                    }
                    if ('enableBackgroundDim' in config) {
                        config.enableBackgroundDim = true;
                    }
                }
                return config;
            } catch (error) {
                console.warn(`[PinchZoomCatcher] ProfileCardConfig 생성 실패: ${error}`);
            }
        }

        return {
            closeOnClickOutside: true,
            enableBackgroundDim: true,
        };
    }

    private ResolveCamera(): Camera | null {
        const follow = this.cameraFollow ?? GameObject.FindObjectOfType<CameraFollow2D>() as CameraFollow2D;
        if (follow) {
            const cam = follow.GetComponent<Camera>() as Camera;
            if (cam) return cam;
        }
        return Camera.main;
    }

    private Update() {
        const isOpen = this.IsProfileCardOpen();
        if (isOpen !== this._profileCardWasOpen) {
            this._profileCardWasOpen = isOpen;
            this.ApplyRaycastState(!isOpen);
        }
    }

    private ApplyRaycastState(enableInteraction: boolean) {
        this._inputBlocked = !enableInteraction;
        if (this._canvasGroup) {
            this._canvasGroup.blocksRaycasts = enableInteraction;
        }

        if (enableInteraction) {
            this._tapCandidateId = null;
        } else {
            this.ResetPointers();
        }
    }

    private ResetPointers() {
        this._p0Id = null;
        this._p1Id = null;
        this._prevDist = null;
        this._tapCandidateId = null;
    }

    private IsProfileCardOpen(): boolean {
        const card = SocialModule?.ProfileCard?.instance;
        if (!card) return false;

        try {
            if (typeof card.isOpened === 'boolean') return card.isOpened;
            if (typeof card.IsOpened === 'function') return !!card.IsOpened();
            if (typeof card.isOpen === 'boolean') return card.isOpen;
            if (typeof card.IsOpen === 'function') return !!card.IsOpen();
            const root = card.root ?? card.transform ?? card.gameObject;
            if (root && typeof root.activeInHierarchy === 'boolean') {
                return root.activeInHierarchy;
            }
        } catch (error) {
            console.warn(`[PinchZoomCatcher] Failed to query ProfileCard state: ${error}`);
        }
        return false;
    }

    private TryCloseProfileCard(): boolean {
        const card = SocialModule?.ProfileCard?.instance;
        if (!card) return false;

        try {
            const candidates: Array<() => any> = [
                card.Close?.bind(card),
                card.close?.bind(card),
                card.Dismiss?.bind(card),
                card.dismiss?.bind(card),
                card.Hide?.bind(card),
                card.hide?.bind(card),
                card.CloseImmediate?.bind(card),
                card.closeImmediate?.bind(card),
            ];

            for (const invoke of candidates) {
                if (typeof invoke !== 'function') continue;
                try {
                    invoke();
                    this.ApplyRaycastState(true);
                    this._profileCardWasOpen = false;
                    return true;
                } catch (error) {
                    console.warn(`[PinchZoomCatcher] Exception trying to close profile card: ${error}`);
                }
            }
        } catch (error) {
            console.warn(`[PinchZoomCatcher] Exception trying to close profile card: ${error}`);
        }

        if (this.ForceDeactivateProfileCard(card)) {
            this.ApplyRaycastState(true);
            this._profileCardWasOpen = false;
            return true;
        }

        return false;
    }

    private ForceDeactivateProfileCard(card: any): boolean {
        try {
            const root = card?.root ?? card?.gameObject ?? card?.transform;
            const go = root?.gameObject ?? root;
            if (go && typeof go.SetActive === 'function') {
                go.SetActive(false);
                return true;
            }
        } catch (error) {
            console.warn(`[PinchZoomCatcher] Failed to force deactivate profile card: ${error}`);
        }
        return false;
    }

    private CloseProfileCardIfOpen(): boolean {
        if (this.IsProfileCardOpen()) {
            this.TryCloseProfileCard();
            return true;
        }
        return false;
    }
}