// Assets/Scripts/World/Zepeto2DWorldManager.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoPlayers, ZepetoPlayer, ZepetoCamera, ZepetoCharacter } from 'ZEPETO.Character.Controller';
import {
    GameObject, WaitForEndOfFrame, Time, CharacterController, Camera,
    Vector2, Vector3, SpriteRenderer,
    Rigidbody2D,
    Physics2D,
    Object,
    Quaternion,Transform
} from 'UnityEngine';
import Zepeto2DPlayer from './Zepeto2DPlayer';
import CameraFollow2D from './CameraFollow2D';
import MapBoundsProvider from './MapBoundsProvider';
import Player2DHandle from './Player2DHandle';
import ScreenshotController from '../../../BuilditTemplate/Modules/Screenshot/Scripts/ScreenshotController';

type YRange = { valid: boolean; minY: number; maxY: number };

export default class Zepeto2DWorldManager extends ZepetoScriptBehaviour {
    // ── Singleton ──────────────────────────────────────────────────────────────
    public static Instance: Zepeto2DWorldManager | null = null;

    Awake() {
        if (Zepeto2DWorldManager.Instance && Zepeto2DWorldManager.Instance !== this) {
            GameObject.Destroy(this.gameObject);
            return;
        }
        Zepeto2DWorldManager.Instance = this;
        GameObject.DontDestroyOnLoad(this.gameObject);

        // Pre-scan all MapBoundsProviders that are already active in the scene.
        this._providers = GameObject.FindObjectsOfType<MapBoundsProvider>() as MapBoundsProvider[];
        // (No register/unregister API anymore—single source of truth lives here.)
    }

    // ── Centralized configs ────────────────────────────────────────────────────
    public runSpeed: number = 5.0;
    public walkSpeed: number = 2.2;
    public runThreshold: number = 0.6;
 
    // ── Runtime refs ───────────────────────────────────────────────────────────
    private _camFollow: CameraFollow2D | null = null;
    private _local2D: Zepeto2DPlayer | null = null;
    private _sessionToPlayer: Map<string, ZepetoPlayer> = new Map();
    private _characterLookup: Map<number, string> = new Map();

    // All map roots (providers) discovered at Awake
    private _providers: MapBoundsProvider[] = [];

    // Active map root
    private _activeMapRoot: GameObject | null = null;

    public get activeMapRoot(): GameObject { return this._activeMapRoot; }
    
    
    Start() {
        // Cache CameraFollow2D on the main camera (if any)
        const main = Camera.main;
        if (main) {
            this._camFollow = main.GetComponent<CameraFollow2D>() as CameraFollow2D;
        }

        // Player lifecycle: only subscribe here
        const zp = ZepetoPlayers.instance;
        if (!zp) return;

        zp.OnAddedPlayer.AddListener((sessionId: string) => {
            const player = zp.GetPlayer(sessionId);
            if (!player) return;
            this.RegisterPlayer(sessionId, player);

            if (player.isLocalPlayer) {
                this.StartCoroutine(this.SetupLocalWhenReady(player));
            } else {
                this.StartCoroutine(this.TrackPlayerCharacter(sessionId));
            }
        });

        zp.OnRemovedPlayer.AddListener((sessionId: string) => {
            this.UnregisterPlayer(sessionId);
        });
    }
    
    // Setup screenshot camera - called from SetupLocalWhenReady after everything is initialized
    private *SetupScreenshotCameraForLocal() {
        if (!this._camFollow) {
            console.error("[Zepeto2DWorldManager] _camFollow is null!");
            return;
        }
        
        const screenshotController = GameObject.FindObjectOfType<ScreenshotController>();
        if (!screenshotController) {
            console.error("[Zepeto2DWorldManager] ScreenshotController not found!");
            return;
        }
        
        const cam = this._camFollow.GetComponent<Camera>();
        if (!cam) {
            console.error("[Zepeto2DWorldManager] Camera component not found on CameraFollow2D!");
            return;
        }
        
        // Create a clean camera GameObject for screenshot (without CameraFollow2D script)
        const screenshotCamObj = new GameObject("ScreenshotCameraProxy");
        GameObject.DontDestroyOnLoad(screenshotCamObj);
        screenshotCamObj.SetActive(false); // Keep it inactive until screenshot time
        
        const screenshotCam = screenshotCamObj.AddComponent<Camera>();
        
        // Copy all camera settings from the 2D camera
        screenshotCam.orthographic = cam.orthographic;
        screenshotCam.orthographicSize = cam.orthographicSize;
        screenshotCam.nearClipPlane = cam.nearClipPlane;
        screenshotCam.farClipPlane = cam.farClipPlane;
        screenshotCam.cullingMask = cam.cullingMask;
        screenshotCam.backgroundColor = cam.backgroundColor;
        screenshotCam.clearFlags = cam.clearFlags;
        screenshotCam.depth = cam.depth;
        
        // Sync transform
        screenshotCamObj.transform.position = cam.transform.position;
        screenshotCamObj.transform.rotation = cam.transform.rotation;
        screenshotCamObj.transform.localScale = cam.transform.localScale;
        
        console.log(`[Zepeto2DWorldManager] Created proxy camera - Orthographic: ${screenshotCam.orthographic}, Size: ${screenshotCam.orthographicSize}, Position: ${screenshotCam.transform.position}`);
        
        // Set this proxy camera as the screenshot camera
        screenshotController.SetScreenshotCamera(screenshotCam);
        
        console.log("[Zepeto2DWorldManager] ✅ Screenshot camera set to 2D proxy camera (from SetupLocalWhenReady)");
        
        // Keep syncing the proxy camera with the main camera
        this.StartCoroutine(this.SyncScreenshotCameraPosition(cam, screenshotCam));
    }
    
    // Keep the proxy camera in sync with the actual 2D camera
    private *SyncScreenshotCameraPosition(sourceCam: Camera, targetCam: Camera) {
        while (sourceCam && targetCam) {
            targetCam.transform.position = sourceCam.transform.position;
            targetCam.transform.rotation = sourceCam.transform.rotation;
            targetCam.orthographicSize = sourceCam.orthographicSize;
            yield null;
        }
    }

    // ── Exposed getters ───────────────────────────────────────────────────────
    public get LocalHandle(): Player2DHandle | null { return this._local2D.player2dHandle; }
    public get ActiveMapRoot(): GameObject | null { return this._activeMapRoot; }

    // ── Local player setup (single place) ──────────────────────────────────────
    private *SetupLocalWhenReady(zp: ZepetoPlayer): IterableIterator<any> {
        // 1) Wait ZepetoPlayer + character
        const start = Time.time, timeout = 6;
        while (Time.time - start < timeout) {
            if (zp && zp.character) break;
            yield null;
        }
        if (!zp || !zp.character) return;

        // 2) Stop built-in SM to prevent CharacterController.Move calls after we disable CC
        try { (zp.character as any)?.StateMachine?.Stop(); } catch { }

        // 3) Give a frame for Stop() to propagate
        yield new WaitForEndOfFrame();

        // 4) Disable default Zepeto camera (with a short fallback probe)
        let zc = GameObject.FindObjectOfType<ZepetoCamera>() as ZepetoCamera;
        if (zc) {
            zc.gameObject.SetActive(false);
        } else {
            const camWaitStart = Time.time;
            while (Time.time - camWaitStart < 3) {
                yield new WaitForEndOfFrame();
                zc = GameObject.FindObjectOfType<ZepetoCamera>() as ZepetoCamera;
                if (zc) { zc.gameObject.SetActive(false); break; }
            }
        }

        // 5) Disable CharacterController AFTER SM stopped
        const cc = zp.character.GetComponentInChildren<CharacterController>() as CharacterController;
        if (cc) cc.enabled = false;

        // 6) Attach/config our 2D controller (idempotent)
        let ctrl = zp.character.GetComponent<Zepeto2DPlayer>() as Zepeto2DPlayer;
        if (!ctrl) ctrl = zp.character.gameObject.AddComponent<Zepeto2DPlayer>();
        ctrl.runSpeed = this.runSpeed;
        ctrl.walkSpeed = this.walkSpeed;
        ctrl.runThreshold = this.runThreshold;
        ctrl.BindZepetoPlayer(zp);

        // Set character scale (similar to NPC scaling)
        zp.character.gameObject.transform.localEulerAngles = new Vector3(0, 180, 0);
        this._local2D = ctrl;

        // 7) Camera target & initial bounds
        if (this._camFollow) {
            // Use property to avoid dependency on a SetTarget() helper
            this._camFollow.target = zp.character.transform;

            // Give one frame so (a) our providers exist, (b) transforms are stable
            yield new WaitForEndOfFrame();
            
            // Setup screenshot camera after everything is ready
            yield* this.SetupScreenshotCameraForLocal();

            // Pick initial map by player position among pre-scanned providers
            const initial = this.pickInitialMapByPosition(zp.character.transform.position);

            // Activate chosen map, disable others, and snap camera immediately
            this.SetActiveBoundsRoot(initial, /*snapNow=*/true, /*disableOthers=*/true);
            
            // Set initial zoom using startOrthoSize
            if (this._camFollow) {
                this._camFollow.SetZoom(this._camFollow.startOrthoSize, /*immediate=*/true);
                console.log(`[Zepeto2DWorldManager] Initial zoom set to start: ${this._camFollow.orthographicSize.toFixed(2)}`);
            }
        }
    }
    private RegisterPlayer(sessionId: string, player: ZepetoPlayer) {
        this._sessionToPlayer.set(sessionId, player);
        this.StartCoroutine(this.TrackPlayerCharacter(sessionId));
    }

    private UnregisterPlayer(sessionId: string) {
        this._sessionToPlayer.delete(sessionId);

        for (const [key, value] of Array.from(this._characterLookup.entries())) {
            if (value === sessionId) {
                this._characterLookup.delete(key);
            }
        }
    }

    private *TrackPlayerCharacter(sessionId: string): IterableIterator<any> {
        const start = Time.time;
        const timeout = 6;

        while (Time.time - start < timeout) {
            const player = this._sessionToPlayer.get(sessionId);
            if (!player) return;
            const character = player.character;
            if (character) {
                this._characterLookup.set(character.gameObject.GetInstanceID(), sessionId);

                const ctrl = character.GetComponent<Zepeto2DPlayer>() as Zepeto2DPlayer;
                if (ctrl) {
                    ctrl.BindZepetoPlayer(player);
                }

                const handle = character.GetComponentInChildren<Player2DHandle>(true) as Player2DHandle;
                if (handle) {
                    if (!handle.owner && ctrl) {
                        handle.owner = ctrl;
                    }
                    handle.isLocal = player.isLocalPlayer;
                }

                return;
            }
            yield null;
        }
    }

    public ResolvePlayerFromTransform(target: Transform | null): ZepetoPlayer | null {
        if (!target) return null;
        const character = target.GetComponentInParent<ZepetoCharacter>() as ZepetoCharacter;
        return this.ResolvePlayerFromCharacter(character);
    }

    public ResolvePlayerFromCharacter(character: ZepetoCharacter | null): ZepetoPlayer | null {
        if (!character) return null;
        const instanceId = character.gameObject.GetInstanceID();
        const sessionId = this._characterLookup.get(instanceId);
        if (sessionId) {
            const player = this._sessionToPlayer.get(sessionId);
            if (player) return player;
        }

        for (const [sid, player] of this._sessionToPlayer.entries()) {
            if (player && player.character === character) {
                this._characterLookup.set(instanceId, sid);
                return player;
            }
        }

        return null;
    }


    // ── Choosing an initial map ────────────────────────────────────────────────
    private pickInitialMapByPosition(pos: Vector3): GameObject | null {
        if (!this._providers || this._providers.length === 0) return null;

        // 1) Prefer provider whose combined bounds contains the position
        for (let i = 0; i < this._providers.length; i++) {
            const root = this._providers[i]?.gameObject;
            if (!root || !root.activeInHierarchy) continue;

            const rends = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
            if (!rends || rends.length === 0) continue;

            let b = rends[0].bounds;
            for (let k = 1; k < rends.length; k++) b.Encapsulate(rends[k].bounds);

            if (b.Contains(new Vector3(pos.x, pos.y, b.center.z))) return root;
        }

        // 2) Otherwise, the nearest provider root
        let best: GameObject | null = null;
        let bestD = Number.POSITIVE_INFINITY;
        for (let i = 0; i < this._providers.length; i++) {
            const g = this._providers[i]?.gameObject;
            if (!g || !g.activeInHierarchy) continue;
            const d = Vector3.SqrMagnitude(Vector3.op_Subtraction(g.transform.position, pos));
            if (d < bestD) { bestD = d; best = g; }
        }
        return best;
    }

    // ── Map activation / camera bounds swap ────────────────────────────────────
    /**
     * Make `mapRoot` the active camera-bounds source and (optionally) disable all others.
     * Also snaps the camera immediately if requested.
     */
    public SetActiveBoundsRoot(mapRoot: GameObject | null, snapNow: boolean = true, disableOthers: boolean = true) {
        this._activeMapRoot = mapRoot;

        if (mapRoot && !mapRoot.activeSelf) mapRoot.SetActive(true);

        if (this._camFollow) {
            this._camFollow.SetBGFromRoot(mapRoot);
            this._camFollow.RefreshBGAndBounds();
            if (snapNow) this._camFollow.SnapToTargetImmediate();
        }

        if (disableOthers) this.disableAllProvidersExcept(mapRoot);
    }

    /** Turn OFF every provider root except the active one. */
    private disableAllProvidersExcept(active: GameObject | null) {
        if (!this._providers) return;
        for (let i = 0; i < this._providers.length; i++) {
            const root = this._providers[i]?.gameObject;
            if (!root) continue;
            if (active && root === active) continue;
            if (root.activeSelf) root.SetActive(false);
        }
    }

    // ── Utility: world Y range for Z-from-Y mapping (used by Zepeto2DPlayer) ──
    public GetWorldYRange(): YRange {
        const root = this._activeMapRoot;
        if (!root) return { valid: false, minY: 0, maxY: 0 };

        const rends = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
        if (!rends || rends.length === 0) return { valid: false, minY: 0, maxY: 0 };

        let b = rends[0].bounds;
        for (let i = 1; i < rends.length; i++) b.Encapsulate(rends[i].bounds);
        return { valid: true, minY: b.min.y, maxY: b.max.y };
    }

    // ── Centralized teleport  ────────────────────────────────────────
    /** Teleport the local player and switch maps in the correct order. */
    public TeleportLocal(destXY: Vector2, targetRoot: GameObject | null) {
        if (!this._local2D) return;

        const x = destXY.x, y = destXY.y;

        // 1) Hard-snap RB2D this frame (authoritative source) — no interpolation, no inertia.
        let rb2d = this.LocalHandle.GetComponent<Rigidbody2D>() as Rigidbody2D;
        if (!rb2d) rb2d = this._local2D.GetComponentInChildren<Rigidbody2D>(true) as Rigidbody2D;

        if (rb2d) {
            const wasSim = rb2d.simulated;
            const wasInterp = rb2d.interpolation;

            rb2d.simulated = false;                 // freeze for manual teleport
            rb2d.velocity = Vector2.zero;
            rb2d.angularVelocity = 0;
            rb2d.position = new Vector2(x, y);      // ⬅️ true teleport (physics space)

            rb2d.simulated = wasSim;                // restore
            rb2d.interpolation = wasInterp;
        }

        // 2) Align visual roots in the same frame (visual Z is temporary; will be refined in LateUpdate).
        this.LocalHandle.transform.position = new Vector3(x, y, 0);
        this._local2D.transform.position = new Vector3(x, y, y); // simple Y→Z; your LateUpdate refines it

        // 3) Ensure physics/render sync this frame so camera sees the new pose immediately.
        Physics2D.SyncTransforms();

        // 4) Turn ON target map → swap camera bounds → snap camera NOW (but don't kill others yet).
        if (targetRoot && !targetRoot.activeSelf) targetRoot.SetActive(true);
        // Snap immediately; defer disabling other maps by one frame to avoid skybox flashes.
        this.SetActiveBoundsRoot(targetRoot, /*snapNow=*/true, /*disableOthers=*/false);

        // 5) After one frame (when the new map has definitely rendered once), turn other maps off.
        this.StartCoroutine(this._DisableOthersNextFrame(targetRoot));
    }

    // Defer turning off all other providers by one frame to eliminate flicker.
    private *_DisableOthersNextFrame(keep: GameObject | null): IterableIterator<any> {
        yield new WaitForEndOfFrame();
        this.disableAllProvidersExcept(keep);
    }
}