import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    Vector2, Vector3, CapsuleCollider, Rigidbody, Animator,
    Mathf, Quaternion, GameObject,
    Rigidbody2D, BoxCollider2D,
    RigidbodyInterpolation2D, RigidbodyType2D, CollisionDetectionMode2D,
    PhysicsMaterial2D,
    Transform,
} from 'UnityEngine';
import Player2DHandle from './Player2DHandle';
import Zepeto2DWorldManager from './Zepeto2DWorldManager'; // <- make sure the path is correct
import { ZepetoPlayer } from 'ZEPETO.Character.Controller';

declare const require: any;
const SocialModule: any = require('ZEPETO.Module.Social');

export default class Zepeto2DPlayer extends ZepetoScriptBehaviour {
    // ───────────────────────────────────────────────────────────────────────────
    // Movement config
    // ───────────────────────────────────────────────────────────────────────────
    /** Max run speed (units/sec). */
    public runSpeed: number = 5.0;
    /** Walk speed (units/sec). */
    public walkSpeed: number = 2.2;
    /** Stick magnitude threshold to switch MoveState to RUN (0..1). */
    public runThreshold: number = 0.6;

    public skinWidth: number = 0.05;
    public maxSlideIterations: number = 3;

    /** Exposed so other scripts (e.g., Portal) can reference the 2D hitbox root. */
    public player2dHandle: Player2DHandle | null = null;

    // ───────────────────────────────────────────────────────────────────────────
    // Animation tuning
    // ───────────────────────────────────────────────────────────────────────────
    public motionSpeedWalk: number = 0.7;
    public motionSpeedRun: number = 0.8;

    // ───────────────────────────────────────────────────────────────────────────
    // Runtime refs
    // ───────────────────────────────────────────────────────────────────────────
    private _capsule: CapsuleCollider | null = null;  // 3D visual collider (optional)
    private _rb: Rigidbody | null = null;             // 3D rigidbody for visual root (kinematic)
    private _anim: Animator | null = null;            // Animator on the visual rig

    // ───────────────────────────────────────────────────────────────────────────
    // State
    // ───────────────────────────────────────────────────────────────────────────
    private _input: Vector2 = Vector2.zero;  // raw input (-1..1)
    private _desiredVel: Vector2 = Vector2.zero; // computed in Update, applied in FixedUpdate

    // 2D physics hitbox (drives movement & collisions)
    private _hitbox2D: Transform | null = null;
    private _rb2d: Rigidbody2D | null = null;
    private _box2d: BoxCollider2D | null = null;

    // World manager (used to fetch current map Y-range for stable Z-from-Y mapping)
    private _wm: Zepeto2DWorldManager | null = null;
    private _ownerPlayer: ZepetoPlayer | null = null;
    private _cachedUserId: string | null = null;
    @SerializeField()
    private profileCardSortOrder: number = 10;

    // ───────────────────────────────────────────────────────────────────────────
    // Input API
    // ───────────────────────────────────────────────────────────────────────────
    /** Called by your input receiver. */
    public ApplyInput(dir: Vector2): void {
        this._input = dir;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ───────────────────────────────────────────────────────────────────────────
    Start() {
        this._wm = Zepeto2DWorldManager.Instance ?? null;
        this.TryBindOwner();

        // Ensure a small 3D capsule exists for visual purposes (optional)
        this._capsule = this.GetComponentInChildren<CapsuleCollider>() as CapsuleCollider;
        if (!this._capsule) {
            this._capsule = this.gameObject.AddComponent<CapsuleCollider>();
            this._capsule.center = new Vector3(0, 0.25, 0);
            this._capsule.height = 0.5;
            this._capsule.radius = 0.32;
            this._capsule.isTrigger = false;
        }

        // 3D Rigidbody on the visual root (kinematic, no gravity)
        this._rb = this.GetComponentInChildren<Rigidbody>() as Rigidbody;
        if (!this._rb) this._rb = this.gameObject.AddComponent<Rigidbody>();
        this._rb.useGravity = false;
        this._rb.isKinematic = true;

        // Animator on the visual rig
        this._anim = this.GetComponentInChildren<Animator>() as Animator;
        if (this._anim) this._anim.applyRootMotion = false;

        // Create the separate 2D hitbox object (drives actual motion & collisions)
        if (!this._hitbox2D) {
            const go = new GameObject("Hitbox2D_" + this.name);
            this._hitbox2D = go.transform;
            this._hitbox2D.position = this.transform.position;
            this._hitbox2D.localRotation = Quaternion.identity;

            // Mark this hitbox as the player's 2D handle
            this.player2dHandle = go.AddComponent<Player2DHandle>() as Player2DHandle;
            this.player2dHandle.owner = this;
            if (Zepeto2DWorldManager.Instance) {
                if (Zepeto2DWorldManager.Instance.LocalHandle === this.player2dHandle) {
                    this.player2dHandle.isLocal = true;
                }
            }

            // Rigidbody2D config tuned for top-down 2D movement
            this._rb2d = go.AddComponent<Rigidbody2D>() as Rigidbody2D;
            this._rb2d.bodyType = RigidbodyType2D.Dynamic;
            this._rb2d.gravityScale = 0;
            this._rb2d.freezeRotation = true;
            this._rb2d.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            this._rb2d.interpolation = RigidbodyInterpolation2D.Interpolate;
            this._rb2d.drag = 50;
            this._rb2d.angularDrag = 0;

            // BoxCollider2D roughly matching the 3D capsule
            this._box2d = go.AddComponent<BoxCollider2D>() as BoxCollider2D;
            if (this._box2d) {
                const mat = new PhysicsMaterial2D();
                mat.bounciness = 0;
                mat.friction = 0;
                this._box2d.sharedMaterial = mat;
            }

            const w = (this._capsule ? this._capsule.radius * 2 : 0.6);
            const h = (this._capsule ? this._capsule.height : 1.8);
            const offY = (this._capsule ? this._capsule.center.y : 0.9);
            this._box2d.size = new Vector2(w, h);
            this._box2d.offset = new Vector2(0, offY);
        }

        // Make sure hitbox is aligned initially
        if (this._hitbox2D) {
            this._hitbox2D.position = new Vector3(this.transform.position.x, this.transform.position.y, 0);
        }
    }

    Update() {
        // 1) Read input and apply a small deadzone
        const dead = 0.15;
        const raw = this._input;
        const mag = raw.magnitude;
        const use = (mag < dead) ? Vector2.zero : raw;

        // 2) Quantize direction to 8 ways (optional stylistic choice)
        const q8 = this.quantize8WithIndex(use);
        const dir8 = q8.dir;

        // 3) Speed from magnitude (walk → run), based on *use* not raw
        const t = Mathf.Clamp01(use.magnitude);
        const speed = Mathf.Lerp(this.walkSpeed, this.runSpeed, t);

        // 4) Record desired velocity (applied in FixedUpdate)
        this._desiredVel = new Vector2(dir8.x * speed, dir8.y * speed);

        // 5) Cut inertia immediately if no input
        if (this._rb2d && t === 0) {
            this._rb2d.velocity = Vector2.zero;
            this._rb2d.angularVelocity = 0;
        }

        // 6) Animation parameters
        if (this._anim) {
            if (dir8.sqrMagnitude > 0) {
                this._anim.SetInteger("State", 102); // Move
                this._anim.SetInteger("MoveState", mag >= this.runThreshold ? 1 : 0); // 0 walk, 1 run
                this._anim.SetFloat("MotionSpeed", Mathf.Lerp(this.motionSpeedWalk, this.motionSpeedRun, t));
            } else if (this._anim.GetInteger("State") === 102) {
                // Moving → Idle once
                this._anim.SetInteger("State", 1);
                this._anim.SetInteger("MoveState", 0);
                this._anim.SetFloat("MotionSpeed", this.motionSpeedWalk);
            }
        }

        // 7) Facing (snap instantly; preserve last when no input)
        if (q8.idx !== -1) {
            // Yaw mapping: 0:E,1:SE,2:S,3:SW,4:W,5:NW,6:N,7:NE
            const yawByIdx = [90, 45, 0, -45, -90, -135, 180, 135];
            const yaw = yawByIdx[q8.idx];
            this.transform.rotation = Quaternion.Euler(0, yaw, 0);
        }
    }

    LateUpdate() {
        // Render-time sync: place the visual root at the 2D hitbox,
        // and compute a stable Z from current Y (for layered sorting / depth).
        if (!this._rb2d) return;
        const hp = this._rb2d.transform.position;
        this.transform.position = new Vector3(hp.x, hp.y, this.computeZFromWorld(hp.y));
    }

    FixedUpdate() {
        if (!this._rb2d) return;

        // If no desired motion → fully stop
        if (this._desiredVel.sqrMagnitude < 1e-6) {
            this._rb2d.velocity = Vector2.zero;
            this._rb2d.angularVelocity = 0;
            return;
        }

        // Otherwise drive at the desired velocity (no acceleration lag)
        this._rb2d.velocity = this._desiredVel;
        this._rb2d.angularVelocity = 0;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Helpers
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Map world Y to visual Z using the current map's Y-range (via WorldManager).
     * The Z output is intentionally constrained to [-80 .. -95] for a subtle parallax.
     * Falls back to a large default range if bounds are not ready.
     */
    private computeZFromWorld(y: number): number {
        const wm = this._wm;
        const outMin = -80, outMax = -95; // NOTE: outMax < outMin on purpose (deeper into negative)
        if (wm && (wm as any).GetWorldYRange) {
            const r = wm.GetWorldYRange();
            if (r && r.valid && r.maxY > r.minY) {
                const t = Mathf.InverseLerp(r.minY, r.maxY, y); // 0..1 within current map
                return Mathf.Lerp(outMin, outMax, t);
            }
        }
        // Fallback range when bounds aren't ready yet
        const tf = Mathf.InverseLerp(-9999, 9999, y);
        return Mathf.Lerp(outMin, outMax, tf);
    }

    /**
     * Quantize a vector to the nearest of 8 cardinal/diagonal directions.
     * Returns {dir, idx}. idx: 0:E,1:SE,2:S,3:SW,4:W,5:NW,6:N,7:NE; -1 if zero.
     */
    private quantize8WithIndex(v: Vector2): { dir: Vector2; idx: number } {
        if (v.sqrMagnitude < 1e-6) return { dir: Vector2.zero, idx: -1 };
        const ang = Mathf.Atan2(v.y, v.x);            // -π..π, 0=+X
        const step = (Mathf.PI * 2) / 8;              // 45°
        const idx = Mathf.Round((ang + Mathf.PI * 2) / step) % 8; // 0..7
        const q = idx * step;
        const x = Mathf.Cos(q), y = Mathf.Sin(q);
        const invLen = 1 / Mathf.Sqrt(x * x + y * y);
        return { dir: new Vector2(x * invLen, y * invLen), idx };
    }

    public BindZepetoPlayer(player: ZepetoPlayer | null) {
        if (!player) return;
        this._ownerPlayer = player;
        this._cachedUserId = player.userId ?? this._cachedUserId;
    }

    public OpenProfileCard(): boolean {
        const player = this.EnsureOwner();
        if (!player) return false;

        const card = SocialModule?.ProfileCard?.instance;
        if (!card) {
            console.warn("[Zepeto2DPlayer] ProfileCard instance is not ready.");
            return false;
        }

        const targetUserId = player.userId ?? this._cachedUserId;
        if (!targetUserId || targetUserId.length === 0) {
            console.warn("[Zepeto2DPlayer] Unable to resolve userId for profile card.");
            return false;
        }

        const needClose = this.IsProfileCardOpen(card);
        if (needClose && !this.TryCloseProfileCard(card)) {
            console.warn("[Zepeto2DPlayer] Unable to close existing profile card before opening a new one.");
        }

        const openSucceeded = this.TryInvokeProfileCardOpen(card, targetUserId);
        if (!openSucceeded) {
            console.error(`[Zepeto2DPlayer] Failed to open profile card for ${targetUserId}.`);
        }
        return openSucceeded;
    }

    private EnsureOwner(): ZepetoPlayer | null {
        if (this._ownerPlayer) return this._ownerPlayer;

        const manager = Zepeto2DWorldManager.Instance;
        if (manager) {
            const resolved = manager.ResolvePlayerFromTransform(this.transform);
            if (resolved) {
                this.BindZepetoPlayer(resolved);
                return resolved;
            }
        }
        return null;
    }

    private TryBindOwner() {
        this.EnsureOwner();
    }

    private TryInvokeProfileCardOpen(card: any, userId: string): boolean {
        if (!card) return false;

        const config = this.CreateProfileCardConfig();

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
            console.error(`[Zepeto2DPlayer] Exception invoking profile card for ${userId}: ${error}`);
        }

        return false;
    }

    private CreateProfileCardConfig(): any {
        const ConfigCtor = SocialModule?.ProfileCardConfig;
        if (ConfigCtor) {
            try {
                const config = new ConfigCtor();
                if (typeof config === 'object') {
                    if ('canvasSortOrder' in config) {
                        config.canvasSortOrder = this.profileCardSortOrder;
                    }
                    if ('closeOnClickOutside' in config) {
                        config.closeOnClickOutside = true;
                    }
                    if ('enableBackgroundDim' in config) {
                        config.enableBackgroundDim = true;
                    }
                }
                return config;
            } catch (error) {
                console.warn(`[Zepeto2DPlayer] ProfileCardConfig 생성 실패: ${error}`);
            }
        }

        return {
            canvasSortOrder: this.profileCardSortOrder,
            closeOnClickOutside: true,
            enableBackgroundDim: true,
        };
    }

    private IsProfileCardOpen(card: any): boolean {
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
            console.warn(`[Zepeto2DPlayer] Failed to determine profile card state: ${error}`);
        }
        return false;
    }

    private TryCloseProfileCard(card: any): boolean {
        if (!card) return false;

        let closed = false;
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
                closed = true;
                break;
            } catch (error) {
                console.warn(`[Zepeto2DPlayer] Exception while closing profile card: ${error}`);
            }
        }

        if (!closed) {
            closed = this.ForceDeactivateProfileCard(card);
        }

        return closed && !this.IsProfileCardOpen(card);
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
            console.warn(`[Zepeto2DPlayer] Failed to force deactivate profile card: ${error}`);
        }
        return false;
    }
}