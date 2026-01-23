// Portal2D_Interact.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { BoxCollider2D, Collider2D, GameObject, Transform, Vector2, Vector3, Time, Object } from 'UnityEngine';
import InteractButtonController, { IInteractable } from './InteractButtonController';
import Player2DHandle from './Player2DHandle';
import Zepeto2DWorldManager from './Zepeto2DWorldManager';
import MapBoundsProvider from './MapBoundsProvider';
import MapTitleToast from './MapTitleToast';
import Localization from '../../../BuilditTemplate/Modules/Localization/ZepetoScript/Localization';

export default class Portal2D extends ZepetoScriptBehaviour implements IInteractable {
    public linkedPortalObj: GameObject | null = null;   // must also be Portal2D
    
    public interactButtonText: string = "Portal";
    
    // Map title toast settings
    public showMapTitleToast: boolean = false;
    public mapTitle: string = "";
    
    @Tooltip("Enable it to use Portal and MapTitle text as localization keys")
    private useLocalization: boolean = false;
    
    // Callback list for teleport event (TypeScript-friendly)
    private _onTeleportedCallbacks: Array<() => void> = [];
    
    private currentMapRoot: GameObject | null = null;    // source map root
    private arrivalPoint: Transform | null = null;       // optional anchor under linked portal
    private arrivalOffset: Vector3 = new Vector3(0, 0, 0);
    private cooldown: number = 0.25;

    private linkedPortal: Portal2D | null = null;
    private _coolUntil: number = 0;

    Awake() {
        // initialize callback array
        this._onTeleportedCallbacks = [];
        console.log(`[Portal2D] Awake() - ${this.gameObject.name} initialized`);
        
        // ensure trigger
        let col = this.GetComponent<BoxCollider2D>() as BoxCollider2D;
        if (!col) col = this.gameObject.AddComponent<BoxCollider2D>() as BoxCollider2D;
        col.isTrigger = true;

        // default current map root
        if (!this.currentMapRoot) {
            this.currentMapRoot =
                this.findMapRootByProvider(this.transform)
                ?? (this.transform.root ? this.transform.root.gameObject : null);
        }

        // resolve linked portal
        if (this.linkedPortalObj) {
            const p = this.linkedPortalObj.GetComponent<Portal2D>() as Portal2D;
            if (p) this.linkedPortal = p;
            else console.warn(`[Portal2D] linkedPortalObj has no Portal2D: ${this.linkedPortalObj.name}`);
        }
    }

    /** Interact button pressed. Route everything through WorldManager. */
    public Interact() {
        if (!this.linkedPortal) return;
        if (Time.time < this._coolUntil) return;

        // 1) fire callbacks on departure portal (before teleport, for banners/effects)
        if (this._onTeleportedCallbacks && this._onTeleportedCallbacks.length > 0) {
            this._onTeleportedCallbacks.forEach(callback => callback());
        }
        
        // 1-1) Show map title toast if enabled
        if (this.showMapTitleToast && this.mapTitle && this.mapTitle.length > 0) {
            const toast = Object.FindObjectOfType<MapTitleToast>(true) as MapTitleToast;
            if (toast) {
                toast.ShowToast(this.useLocalization ? Localization.instance.GetLocalizedText(this.mapTitle) : this.mapTitle );
            } else {
                console.warn("[Portal2D] MapTitleToast not found in scene!");
            }
        }

        // 2) compute destination
        const anchor = this.linkedPortal.arrivalPoint ?? this.linkedPortal.transform;
        const dest = anchor.position;
        const destXY = new Vector2(dest.x + this.arrivalOffset.x, dest.y + this.arrivalOffset.y);

        // 3) resolve target map root by provider
        const targetRoot =
            this.linkedPortal.currentMapRoot
            ?? this.findMapRootByProvider(this.linkedPortal.transform)
            ?? (this.linkedPortal.transform.root ? this.linkedPortal.transform.root.gameObject : null);

        // 4) hand off to WorldManager (teleport + bounds + camera + disable others)
        Zepeto2DWorldManager.Instance?.TeleportLocal(destXY, targetRoot);

        // cooldown & clear UI
        this._coolUntil = Time.time + this.cooldown;
        this.linkedPortal._coolUntil = this._coolUntil;
        InteractButtonController.instance?.SetTarget(null);
    }

    OnTriggerEnter2D(other: Collider2D) {
        const lm = Zepeto2DWorldManager.Instance;
        if (!lm || !InteractButtonController.instance) return;
        
        // linkedPortalObj가 연결되어 있지 않으면 버튼을 표시하지 않음
        if (!this.linkedPortalObj || !this.linkedPortal) return;
        
        if (this.isLocalPlayerCollider(other, lm)) {
            InteractButtonController.instance.SetTarget(this,
                this.useLocalization ? Localization.instance.GetLocalizedText(this.interactButtonText) : this.interactButtonText);
        }
    }

    OnTriggerExit2D(other: Collider2D) {
        if (!InteractButtonController.instance) return;
        const btn = InteractButtonController.instance as any;
        if (!btn.GetTarget || btn.GetTarget() === this) {
            InteractButtonController.instance.SetTarget(null);
        }
    }

    // --- helpers ---

    /** True if this collider belongs to the WorldManager's local Player2DHandle. */
    private isLocalPlayerCollider(col: Collider2D, wm: Zepeto2DWorldManager): boolean {
        const h = (col.GetComponent<Player2DHandle>() as Player2DHandle)
            ?? (col.GetComponentInParent<Player2DHandle>() as Player2DHandle);

        return h && h.isLocal;
    }

    /** climb parents and return the GameObject that has MapBoundsProvider (if any) */
    private findMapRootByProvider(start: Transform | null): GameObject | null {
        let t = start;
        for (let i = 0; i < 16 && t; i++) {
            const mbp = t.GetComponent<MapBoundsProvider>() as MapBoundsProvider;
            if (mbp) return t.gameObject;
            t = t.parent;
        }
        return null;
    }

    // --- Public API for teleport event callbacks ---

    /** Subscribe to teleport event (called when player arrives at this portal). */
    public AddTeleportCallback(callback: () => void) {
        if (!this._onTeleportedCallbacks.includes(callback)) {
            this._onTeleportedCallbacks.push(callback);
        }
    }

    /** Unsubscribe from teleport event. */
    public RemoveTeleportCallback(callback: () => void) {
        const idx = this._onTeleportedCallbacks.indexOf(callback);
        if (idx >= 0) {
            this._onTeleportedCallbacks.splice(idx, 1);
        }
    }
}