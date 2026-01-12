import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    Vector2, Vector3, Mathf, Time, RectTransform, CanvasGroup, Animator, AnimationCurve, Input,
    RectTransformUtility
} from 'UnityEngine';
import {
    PointerEventData, IDragHandler, IPointerClickHandler, IPointerDownHandler, IPointerUpHandler,
    EventTrigger, EventTriggerType, BaseEventData
} from 'UnityEngine.EventSystems';
import { Entry } from 'UnityEngine.EventSystems.EventTrigger'

export default class ZepetoScreenTouchpad
    extends ZepetoScriptBehaviour
    implements IDragHandler, IPointerClickHandler, IPointerDownHandler, IPointerUpHandler {

    // --- Config ---
    public movementRange: number = 100;

    // --- Internal ---
    private m_root: RectTransform;
    private m_PointerDownPos: Vector2 = new Vector2(0, 0);

    // 외부에서 읽는 축 (-1..1)
    private _axis: Vector2 = new Vector2(0, 0);
    public GetAxis(): Vector2 { return this._axis; }

    private m_isTouching: boolean = false;
    public IsTouching(): boolean { return this.m_isTouching; }

    // --- Background FX ---
    public canvasGroupTouchPadBackground: CanvasGroup;
    public touchPadBackgroundCurve: AnimationCurve;
    private isTouched: boolean = false;

    // --- Handle FX ---
    public touchHandle: RectTransform;
    public touchHandleAnimator: Animator;
    public touchHandleOrigin: RectTransform;
    public touchHandleOriginAnimator: Animator;

    Awake() {
            var trigger = this.gameObject.GetComponent<EventTrigger>();
        function Set(type: EventTriggerType, callback: (eventData: PointerEventData) => void) {
            var entry = new Entry();
            entry.eventID = type;
            entry.callback.AddListener(callback);
            trigger.triggers.Add(entry);
        }
        Set(EventTriggerType.Drag, (eventData: PointerEventData) => this.OnDrag(eventData));
        Set(EventTriggerType.PointerDown, (eventData: PointerEventData) => this.OnPointerDown(eventData));
        Set(EventTriggerType.PointerUp, (eventData: PointerEventData) => this.OnPointerUp(eventData));
    }

    Start(): void {
        this.m_root = this.transform as RectTransform;
        this.InitializeTouchPadBackground();
    }

    OnPointerClick(eventData: PointerEventData): void {
        if (!eventData) throw new Error("eventData is null");
    }

    // Down
    OnPointerDown(eventData: PointerEventData): void {
        if (!eventData) throw new Error("eventData is null");
        if (!this.m_root) this.m_root = this.transform as RectTransform;

        const outPos = $ref(new Vector2(0, 0)); // ✅ $ref 로 out 인자 전달
        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(this.m_root, eventData.position, eventData.pressEventCamera, outPos)) {
            this.m_PointerDownPos = $unref(outPos);
            this.m_isTouching = true;

            // FX
            this.TouchPadBackground();
            this.TouchHandleFirstTouch();
            this.TouchHandleEnable(this.m_PointerDownPos);
        }
    }

    // Drag
    OnDrag(eventData: PointerEventData): void {
        if (!eventData) throw new Error("eventData is null");
        if (!this.m_root) this.m_root = this.transform as RectTransform;

        const outPos = $ref(new Vector2(0, 0)); // ✅
        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(this.m_root, eventData.position, eventData.pressEventCamera, outPos)) {
            const position = $unref(outPos);

            // 델타 + 클램프
            let delta = Vector2.op_Subtraction(position, this.m_PointerDownPos);
            delta = Vector2.ClampMagnitude(delta, this.movementRange);

            // 핸들 위치 갱신
            this.TouchHandleSetPosition(position);

            // -1..1 축 저장
            this._axis = new Vector2(delta.x / this.movementRange, delta.y / this.movementRange);
        }
    }

    // Up
    OnPointerUp(eventData: PointerEventData): void {
        if (!eventData) throw new Error("eventData is null");

        this.m_isTouching = false;
        this._axis = new Vector2(0, 0); // 축 리셋

        this.TouchHandleDisable();
    }

    /* ---------- Background FX ---------- */
    private InitializeTouchPadBackground(): void {
        if (this.canvasGroupTouchPadBackground) {
            this.canvasGroupTouchPadBackground.alpha = 0;
            this.canvasGroupTouchPadBackground.gameObject?.SetActive(false);
        }
    }

    private TouchPadBackground(): void {
        if (!this.isTouched) {
            this.isTouched = true;
            this.StartCoroutine(this.TouchPadBackgroundProcess());
        }
    }

    private *TouchPadBackgroundProcess(): IterableIterator<any> {
        if (!this.canvasGroupTouchPadBackground || !this.touchPadBackgroundCurve) return;

        const cg = this.canvasGroupTouchPadBackground;
        cg.gameObject?.SetActive(true);
        cg.alpha = 0;

        // 0.5s Fade-In
        let t = 0;
        while (t < 1) {
            t += Time.deltaTime * 2;
            cg.alpha = this.touchPadBackgroundCurve.Evaluate(t);
            yield null;
        }

        // 1.0s Hold
        t = 0;
        while (t < 1) {
            t += Time.deltaTime;
            yield null;
        }

        // 0.5s Fade-Out
        t = 0;
        while (t < 1) {
            t += Time.deltaTime * 2;
            cg.alpha = 1 - this.touchPadBackgroundCurve.Evaluate(t);
            yield null;
        }

        cg.alpha = 0;
    }

    /* ---------- Handle FX ---------- */
    private TouchHandleEnable(position: Vector2): void {
        if (!this.touchHandle || !this.touchHandleOrigin) return;
        this.touchHandle.localPosition = new Vector3(position.x, position.y, 0);
        this.touchHandleOrigin.localPosition = new Vector3(position.x, position.y, 0);
        if (this.touchHandleAnimator) this.touchHandleAnimator.SetBool("isTouch", true);
        if (this.touchHandleOriginAnimator) this.touchHandleOriginAnimator.SetBool("isTouch", true);
    }

    private TouchHandleDisable(): void {
        if (this.touchHandleAnimator) this.touchHandleAnimator.SetBool("isTouch", false);
        if (this.touchHandleOriginAnimator) this.touchHandleOriginAnimator.SetBool("isTouch", false);
    }

    private TouchHandleSetPosition(position: Vector2): void {
        if (!this.touchHandle || !this.touchHandleOrigin) return;

        const origin = this.touchHandleOrigin.localPosition;
        const from = new Vector2(origin.x, origin.y);
        const diff = Vector2.op_Subtraction(position, from);

        // ✅ 직접 정규화
        const mag = Mathf.Max(0.00001, Mathf.Sqrt(diff.x * diff.x + diff.y * diff.y));
        const dir = new Vector2(diff.x / mag, diff.y / mag);

        const dist = Mathf.Min(Vector2.Distance(position, from), this.movementRange * 0.96);
        const next = new Vector2(from.x + dir.x * dist, from.y + dir.y * dist);

        this.touchHandle.localPosition = new Vector3(next.x, next.y, 0);
    }

    private TouchHandleFirstTouch(): void {
        if (this.touchHandleAnimator) this.touchHandleAnimator.SetTrigger("firstTouch");
        if (this.touchHandleOriginAnimator) this.touchHandleOriginAnimator.SetTrigger("firstTouch");
    }
}