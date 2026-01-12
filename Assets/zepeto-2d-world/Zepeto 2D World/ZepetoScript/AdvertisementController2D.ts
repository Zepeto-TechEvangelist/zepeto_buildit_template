import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    BoxCollider2D,
    Collider2D,
    GameObject,
    Transform,
    Vector2,
    Vector3,
    Time,
    Object,
    RectTransform, Canvas, Camera, RenderMode, RectTransformUtility, Mathf, Resources, Quaternion
} from 'UnityEngine';
import InteractButtonController, { IInteractable } from './InteractButtonController';
import Zepeto2DWorldManager from './Zepeto2DWorldManager';
import MapBoundsProvider from './MapBoundsProvider';
import CameraFollow2D from "./CameraFollow2D";
import Portal2D from './Portal2D';
import PlayerTrigger, { IPlayerTrigger } from '../../../BuilditTemplate/Modules/Scripts/PlayerTrigger';
import UIManager from '../../../BuilditTemplate/Modules/Scripts/UIManager';
import AdvertisementManager from '../../../BuilditTemplate/Modules/Advertisement/AdvertisementManager';
import { Button } from 'UnityEngine.UI';

export default class AdvertisementController2D extends ZepetoScriptBehaviour implements IPlayerTrigger {
    
    public destination: Transform;
    private _currentMap: GameObject;
    
    public iconPrefab: Object;
    public iconLocation: Transform;
    
    Start() {
        const trigger = this.GetComponent<PlayerTrigger>();
        if (trigger) {
            trigger.delegate = this;
        }
        
        this.AutoFindComponents();
        this._currentMap = this.findMapRootByProvider(this.transform);
    }
    
    public DoAction() {

        const cPortal = this.findMapPortal( this.findMapRootByProvider(this.transform) );
        const dPortal = this.findMapPortal( this.findMapRootByProvider(this.destination.transform) );
        
        const dest = this.destination.transform.position;
        const destXY = new Vector2(dest.x, dest.y);
        
        const destinationRoot = this.findMapRootByProvider(this.destination.transform);
        
        Zepeto2DWorldManager.Instance?.TeleportLocal(destXY, destinationRoot);
        
        InteractButtonController.instance?.SetTarget(null);
        this._interactButtonObject.SetActive(false);
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

    private findMapPortal(start: GameObject | null): Portal2D {
        return start.GetComponentInChildren<Portal2D>();
    }
    

    OnPlayerEnter() {
        if (!this._interactButtonObject) {
            this.InstantiateInteractButton();
        }
        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(true);
        }

        this.UpdateInteractButton();
    }

    OnPlayerExit() {
        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(false);
        }
    }

    Update() {
        if (this._interactButtonObject && this._interactButtonObject.activeSelf) {
            // Catch OnPlayer exit missed events when teleporting directly
            if (this._currentMap !== Zepeto2DWorldManager.Instance.activeMapRoot)
                this.OnPlayerExit();

            this.UpdateInteractButton();
        }
    }

    Interact(): void {
        // this.DoAction();
        // return;
        
        AdvertisementManager.Instance.ShowAd(() => {
            this.DoAction();
        });
    }
    
    /** ------------------------------------------------------------------------------------ */
    
    private interactButtonRoot: RectTransform;
    private _interactButtonObject: GameObject;
    private _interactButton: Button;
    private _interactButtonRect: RectTransform;
    private _interactButtonBaseScale: Vector3 | null = null;
    private _isLocalPlayerInside: boolean = false;

    private _speechBubbleObject: GameObject;
    private _canvas: Canvas;
    
    private AutoFindComponents() {
       
        // Auto-find UI canvas for interact button from UIManager GameObject (under Managers)
        if (!this.interactButtonRoot) {
            const uiManager = UIManager.instance;
            if (uiManager) {
                const canvas = uiManager.gameObject.GetComponentInChildren<Canvas>(true);
                if (canvas) {
                    this.interactButtonRoot = canvas.GetComponent<RectTransform>();
                }
            }
        }
    }

    private InstantiateInteractButton() {
        if (this._interactButtonObject || !this.iconPrefab || !this.interactButtonRoot) {
            return;
        }
        
        this._interactButtonObject = Object.Instantiate
        (
            this.iconPrefab,
            this.WorldToScreenPoint(this.iconLocation.position),
            Quaternion.identity,
            this.interactButtonRoot
        ) as GameObject;
        
        this._interactButton = this._interactButtonObject.GetComponentInChildren<Button>();
        
        if (this._interactButton) {
            this._interactButton.onClick.AddListener(() => {
                this.Interact();
            });
        }
        this._interactButtonObject.SetActive(false);
    }

    
    private WorldToScreenPoint(point: Vector3, camera: Camera = null): Vector3 {
        
        if (camera === null) {
            const follow2D = Object.FindObjectOfType<CameraFollow2D>();
            if (follow2D) {
                camera = follow2D.GetComponent<Camera>();
            }
        }
        else {
            camera ??= Camera.main;
        }
        
        var screenPoint = camera.WorldToScreenPoint(point);
        screenPoint.z = 1;
        return screenPoint;
        //
        // // Calculate screen offset based on camera distance (for consistent button spacing)
        // const cameraDistance = Vector3.Distance(gameplayCamera.transform.position, worldPos);
        // const screenOffsetY = this.CalculateScreenOffsetY(cameraDistance, gameplayCamera);
        // const screenOffset = new Vector2(0, screenOffsetY);
        //
        // const localPoint = $ref(new Vector2(0, 0));
        // if (RectTransformUtility.ScreenPointToLocalPointInRectangle(this.interactButtonRoot, new Vector2(screenPoint.x, screenPoint.y), referenceCamera, localPoint)) {
        //     const targetAnchored = Vector2.op_Addition($unref(localPoint), screenOffset);
        //     this._interactButtonRect.anchoredPosition = targetAnchored;
        // }
        //
        // if (this._interactButtonRect) {
        //     let scale = Mathf.Max(0.0001, this.interactButtonScaleMultiplier);
        //     if (gameplayCamera.orthographic) {
        //         const currentOrtho = Math.max(0.001, gameplayCamera.orthographicSize);
        //         const reference = Math.max(0.001, this.interactButtonReferenceOrtho);
        //         scale *= reference / currentOrtho;
        //     }
        //
        //     if (this.interactButtonClampScale) {
        //         scale = Mathf.Clamp(scale, this.interactButtonMinScale, this.interactButtonMaxScale);
        //     }
        //
        //     const baseScale = this._interactButtonBaseScale ?? new Vector3(1, 1, 1);
        //     this._interactButtonRect.localScale = new Vector3(baseScale.x * scale, baseScale.y * scale, baseScale.z);
        // }
    }
    
    private UpdateInteractButton() {
        if (!this._interactButtonRect || !this.interactButtonRoot) {
            return;
        }
        const uiCanvas = this.interactButtonRoot.GetComponentInParent<Canvas>();
        let referenceCamera: Camera = null;
        if (uiCanvas && uiCanvas.renderMode !== RenderMode.ScreenSpaceOverlay) {
            referenceCamera = uiCanvas.worldCamera;
        }

        const point = this.WorldToScreenPoint(this.iconLocation.position, referenceCamera);
        this._interactButtonObject.transform.position = point;
    }

}