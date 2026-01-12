import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Camera, GameObject, Object, AudioSource, Color } from 'UnityEngine';
import { Image } from 'UnityEngine.UI';
import { RoundedRectangleButton } from 'ZEPETO.World.Gui';
import MapBoundsProvider from './MapBoundsProvider';
import Zepeto2DWorldManager from './Zepeto2DWorldManager';
import {UnityEvent$1} from "UnityEngine.Events";
import UIManager from "../../../BuilditTemplate/Modules/Scripts/UIManager";

/**
 * BGM manager that:
 *  - Finds "BGM" AudioSource objects under each Map root (MapBoundsProvider).
 *  - Keeps everything paused by default.
 *  - Only plays tracks that belong to the *active* map root.
 *  - Provides a UI toggle for master mute (pause/resume current map’s tracks).
 *
 * Assumptions:
 *  - Each map root (the GameObject that has MapBoundsProvider) contains a child
 *    GameObject named exactly "BGM" with one or more AudioSource components.
 */
export default class Zepeto2DBGMManager extends ZepetoScriptBehaviour {

    /** Master mute state (true = paused). */
    public muted: bool = false;

    /** If true, play current map’s BGM on start (unless muted). */
    public playOnStart: bool = true;

    // Map root -> AudioSources[] (collected once, includes inactive maps)
    private _tracksByRoot: Map<GameObject, AudioSource[]> = new Map();

    // Currently active map root we’re playing
    private _activeRoot: GameObject | null = null;

    // Cache world manager
    private _wm: Zepeto2DWorldManager | null = null;

    Awake() {
        // Try get world manager
        this._wm = Zepeto2DWorldManager.Instance ?? (Object.FindObjectOfType<Zepeto2DWorldManager>() as Zepeto2DWorldManager);

        // Collect BGM sources under every MapBoundsProvider (include inactive)
        this.collectAllMapBGMs();
        // Ensure all are paused at boot; we'll selectively play current later
        this.pauseAll();
    }

    Start() {
        // Set the first active root from world manager and play if required
        const root = this.getActiveMapRoot();
        this.switchActiveRoot(root, /*autoplay*/ this.playOnStart && !this.muted);
    
        this.LateInit();
    }

    private _activeEvent: UnityEvent$1<boolean>;
    private LateInit() {

        this._activeEvent = new UnityEvent$1<boolean>();
        UIManager.instance.CreateToggleGroup("music", this._activeEvent, (isOn) => {
            this.muted = !isOn;
            
            // Pause/resume only the *current* map’s tracks
            if (this._activeRoot) {
                const list = this._tracksByRoot.get(this._activeRoot) ?? [];
                if (this.muted) list.forEach(a => a?.Pause());
                else list.forEach(a => { if (a && !a.isPlaying) a.Play(); });
            }
        });
        
        this._activeEvent?.Invoke(!this.muted); // Initial configuration
    }

    Update() {
        // Poll for active map change; switch tracks instantly when it changes
        const root = this.getActiveMapRoot();
        if (root !== this._activeRoot) {
            this.switchActiveRoot(root, /*autoplay*/ !this.muted);
        }
    }

    // ───────────────────────────────────────── UI ──────────────────────────────

    public ToggleMute() {
        this.muted = !this.muted;

        // Pause/resume only the *current* map’s tracks
        if (this._activeRoot) {
            const list = this._tracksByRoot.get(this._activeRoot) ?? [];
            if (this.muted) list.forEach(a => a?.Pause());
            else list.forEach(a => { if (a && !a.isPlaying) a.Play(); });
        }

        this._activeEvent?.Invoke(!this.muted);
    }
    

    // ─────────────────────────────── Discovery/setup ───────────────────────────

    private collectAllMapBGMs() {
        this._tracksByRoot.clear();

        const providers = Object.FindObjectsOfType<MapBoundsProvider>(/*includeInactive*/ true);
        if (!providers || providers.length === 0) return;

        for (let i = 0; i < providers.length; i++) {
            const root = providers[i]?.gameObject;
            if (!root) continue;

            // find children GameObjects named "BGM" (include inactive)
            const allAudios = root.GetComponentsInChildren<AudioSource>(true) as AudioSource[];
            const bgms = allAudios.filter(a => a && a.gameObject && a.gameObject.name === "BGM");

            // normalize sources (manual control)
            bgms.forEach(a => {
                a.playOnAwake = false;
                // do not rely on mute flag—use Pause/Play so time position is preserved
                try { a.Stop(); } catch { }
            });

            this._tracksByRoot.set(root, bgms);
        }
    }

    private pauseAll() {
        this._tracksByRoot.forEach(list => list.forEach(a => a?.Pause()));
    }

    // ─────────────────────────────── Active map switch ─────────────────────────

    private switchActiveRoot(nextRoot: GameObject | null, autoplay: boolean) {
        // Pause & reset previous
        if (this._activeRoot) {
            const prevList = this._tracksByRoot.get(this._activeRoot) ?? [];
            prevList.forEach(a => a?.Pause());
        }

        this._activeRoot = nextRoot;

        // Play (or remain paused) on the new root
        if (!this._activeRoot) return;

        // If we discovered providers before this root existed (e.g., spawned later),
        // try to (re)collect once.
        if (!this._tracksByRoot.has(this._activeRoot)) {
            this.collectAllMapBGMs();
        }

        const list = this._tracksByRoot.get(this._activeRoot) ?? [];
        if (autoplay && !this.muted) {
            list.forEach(a => {
                if (a && !a.isPlaying) a.Play();
            });
        } else {
            list.forEach(a => a?.Pause());
        }
    }

    // ─────────────────────────────── Helpers ───────────────────────────────────

    private getActiveMapRoot(): GameObject | null {
        // Prefer WorldManager if present; otherwise try camera-follow’s active root
        if (this._wm && this._wm.ActiveMapRoot) return this._wm.ActiveMapRoot;

        // Fallback: pick an enabled provider’s root, if any
        const providers = Object.FindObjectsOfType<MapBoundsProvider>(true);
        for (let i = 0; i < providers.length; i++) {
            const root = providers[i]?.gameObject;
            if (root && root.activeInHierarchy) return root;
        }
        return null;
    }
}