// Assets/Scripts/Camera/CameraFollow2D.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Transform, Camera, Mathf, Vector3, SpriteRenderer, Bounds, GameObject, Time, Input, KeyCode } from 'UnityEngine';

export default class CameraFollow2D extends ZepetoScriptBehaviour {
    public target: Transform | null = null;
    public bgRenderers: SpriteRenderer[] = [];

	public orthographicSize: number = 6;
	public offsetRatio: Vector3 = new Vector3(0, 0, 0);
    public padding: number = 0;
    public minOrtho: number = 3;
    public maxOrtho: number = 14;
	public startOrthoSize: number = 6; // Initial zoom level on start
    
    public zoomSmoothSpeed: number = 10;  // higher = faster zoom response (0 = instant)

    private _cam: Camera | null = null;
    private _cachedBounds: Bounds | null = null;
    private _targetOrthoSize: number = 6;  // smooth zoom target

    Awake() {
        this._cam = this.GetComponent<Camera>() as Camera;
        if (this._cam) { 
            this._cam.orthographic = true;
			// Apply initial zoom level (clamp only by min/max before bounds check)
			const startSize = Mathf.Clamp(this.startOrthoSize, this.minOrtho, this.maxOrtho);
			this._targetOrthoSize = startSize;
			this.orthographicSize = startSize;
			this._cam.orthographicSize = startSize;
        }
    }

    Update() {
        // Keyboard zoom simulation (Editor & Build)
        // Hold keys for continuous zoom
        if (Input.GetKey(KeyCode.Equals) || Input.GetKey(KeyCode.KeypadPlus)) {
            // Zoom In (-, smaller ortho)
            this.ApplyZoomDelta(-0.2);
        }
        if (Input.GetKey(KeyCode.Minus) || Input.GetKey(KeyCode.KeypadMinus)) {
            // Zoom Out (+, larger ortho)
            this.ApplyZoomDelta(0.2);
        }
        
        // Quick presets (1, 2, 3 keys)
        if (Input.GetKeyDown(KeyCode.Alpha1)) {
            this._targetOrthoSize = this.ClampSize(this.minOrtho);
            console.log(`[CameraFollow2D] Zoom: MIN (${this._targetOrthoSize.toFixed(1)})`);
        }
        if (Input.GetKeyDown(KeyCode.Alpha2)) {
            this._targetOrthoSize = this.ClampSize(6);
            console.log(`[CameraFollow2D] Zoom: DEFAULT (${this._targetOrthoSize.toFixed(1)})`);
        }
        if (Input.GetKeyDown(KeyCode.Alpha3)) {
            this._targetOrthoSize = this.ClampSize(this.maxOrtho);
            console.log(`[CameraFollow2D] Zoom: MAX (${this._targetOrthoSize.toFixed(1)})`);
        }
        
        // Show current zoom (0 key)
        if (Input.GetKeyDown(KeyCode.Alpha0)) {
            console.log(`[CameraFollow2D] Current Zoom: ${this.orthographicSize.toFixed(1)} (Target: ${this._targetOrthoSize.toFixed(1)})`);
        }
    }

    // Passive follow – no interpolation to avoid "double move"
    LateUpdate() {
        if (!this._cam || !this.target) return;
        
        // Smooth zoom with constant speed (no acceleration/deceleration)
        if (this.zoomSmoothSpeed > 0) {
            const maxDelta = Time.deltaTime * this.zoomSmoothSpeed;
            this.orthographicSize = Mathf.MoveTowards(this.orthographicSize, this._targetOrthoSize, maxDelta);
        } else {
            this.orthographicSize = this._targetOrthoSize;
        }
        
        // Apply clamping to both the variable and camera
        this.orthographicSize = this.ClampSize(this.orthographicSize);
        this._cam.orthographicSize = this.orthographicSize;

        const halfH = this._cam.orthographicSize;
        const halfW = halfH * Mathf.Max(0.0001, this._cam.aspect);

		const tp = this.target.position;
		// Apply offsetRatio as a ratio of current view size
		const offX = this.offsetRatio.x * halfW;
		const offY = this.offsetRatio.y * halfH;
		let wantX = tp.x + offX;
		let wantY = tp.y + offY;

        if (this._cachedBounds) {
            const b = this._cachedBounds;
            const minX = b.min.x + halfW + this.padding, maxX = b.max.x - halfW - this.padding;
            const minY = b.min.y + halfH + this.padding, maxY = b.max.y - halfH - this.padding;
            wantX = (minX <= maxX) ? Mathf.Clamp(wantX, minX, maxX) : (minX + maxX) * 0.5;
            wantY = (minY <= maxY) ? Mathf.Clamp(wantY, minY, maxY) : (minY + maxY) * 0.5;
        }

        this.transform.position = new Vector3(wantX, wantY, this.transform.position.z);
    }

    // API called by WorldManager
    public SetTarget(t: Transform | null) {
        this.target = t;
        if (t) this.SnapToTargetImmediate();
    }

    public SetBGRenderers(renders: SpriteRenderer[] | null) {
        this.bgRenderers = (renders ?? []).filter(r => !!r);
        this.RefreshBGAndBounds();
    }
    public SetBGFromRoot(root: GameObject | null) {
        if (!root) { this.bgRenderers = []; this._cachedBounds = null; return; }
        this.bgRenderers = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
        this.RefreshBGAndBounds();
    }
    public RefreshBGAndBounds() {
        const list = (this.bgRenderers ?? []).filter(r => r && r.sprite && r.gameObject.activeInHierarchy);
        if (list.length === 0) { this._cachedBounds = null; return; }
        let b = list[0].bounds; for (let i = 1; i < list.length; i++) b.Encapsulate(list[i].bounds);
        this._cachedBounds = (b.size.x > 0.0001 && b.size.y > 0.0001) ? b : null;
        
        if (this._cachedBounds && this._cam) {
            const aspect = this._cam.aspect;
            const maxOrtho = this.ComputeBoundMaxOrtho();
            console.log(`[CameraFollow2D] Map Bounds: ${b.size.x.toFixed(2)} × ${b.size.y.toFixed(2)} units, Aspect: ${aspect.toFixed(2)}, MaxOrtho: ${maxOrtho.toFixed(2)}, Current: ${this.orthographicSize.toFixed(2)}`);
        }
    }
    public SnapToTargetImmediate() { this.LateUpdate(); }
    
    public GetCachedBounds(): Bounds | null {
        return this._cachedBounds;
    }

    public ClampSize(size: number): number {
        if (!this._cam) return size;
        const mapMax = this.ComputeBoundMaxOrtho();
        const hi = Number.isFinite(mapMax) ? Mathf.Min(this.maxOrtho, mapMax) : this.maxOrtho;
        return Mathf.Clamp(size, this.minOrtho, hi);
    }
    
    public ComputeBoundMaxOrtho(): number {
        if (!this._cam || !this._cachedBounds) return Number.POSITIVE_INFINITY;
        const width = this._cachedBounds.size.x - this.padding * 2;
        const height = this._cachedBounds.size.y - this.padding * 2;
        if (width <= 0 || height <= 0) return Number.POSITIVE_INFINITY;
        const aspect = Mathf.Max(0.0001, this._cam.aspect);
        // Max ortho = when camera view exactly fits the map
        // If camera is bigger, it will show outside the map
        return Mathf.Max(0.0001, Mathf.Min(height * 0.5, (width * 0.5) / aspect));
    }

    public ApplyZoomDelta(deltaOrtho: number) {
        if (!this._cam) return;
        this._targetOrthoSize = this.ClampSize(this._targetOrthoSize + deltaOrtho);
    }
    
    public SetZoom(orthoSize: number, immediate: boolean = false) {
        if (!this._cam) return;
        const clampedSize = this.ClampSize(orthoSize);
        this._targetOrthoSize = clampedSize;
        if (immediate) {
            this.orthographicSize = clampedSize;
            this._cam.orthographicSize = clampedSize;
        }
    }
}