import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoContext } from 'Zepeto';
import {
    Bounds,
    Canvas,
    Camera,
    CharacterController,
    GameObject,
    Mathf,
    MeshRenderer,
    Object,
    RectTransform,
    RectTransformUtility,
    RenderMode,
    Renderer,
    Resources,
    SkinnedMeshRenderer,
    SpriteRenderer,
    Transform,
    Vector2,
    Vector3,
    WaitForEndOfFrame
} from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import PlayerTrigger, { IPlayerTrigger } from '../../../../BuilditTemplate/Modules/Scripts/PlayerTrigger';
import NpcTalk from './NpcTalk';
import CameraFollow2D from '../CameraFollow2D';
import { GetDialogueData } from './NpcDialogueData';
import Zepeto2DWorldManager from '../Zepeto2DWorldManager';
import UIManager from '../../../../BuilditTemplate/Modules/Scripts/UIManager';

type HeadLocator = () => Vector3;

export type NpcReadyConfig = {
    npcRoot?: Transform | null;
    headOffset?: Vector3 | null;
    headLocator?: HeadLocator | null;
    characterScale?: number | null; // Character scale from ZepetoContext (for accurate height calculation)
};

export class DialogueOption {
    @SerializeField()
    @Tooltip('Button text that player sees')
    public question: string;

    @SerializeField()
    @Tooltip('NPC response when player clicks this button')
    public answer: string;

    constructor() {
        this.question = '';
        this.answer = '';
    }
}

export default abstract class NPCBase extends ZepetoScriptBehaviour implements IPlayerTrigger {

    @Header("Required Settings")
    @SerializeField()
    @Tooltip("Panel for dialogue screen")
    protected dialoguePanel: GameObject;

    @Header("Dialogue Settings")
    @SerializeField()
    @Tooltip("NPC dialogue ID (used to lookup dialogue data from NpcDialogueData.ts). Use the editor window (ZEPETO 2D > Edit NPC Dialogue) to edit dialogue.")
    @Header("💡 Use ZEPETO 2D > Edit NPC Dialogue menu to edit dialogue")
    protected dialogueId: string = 'npc_1';


    // Internal settings - not exposed in inspector
    private _speechBubbleActive: boolean = false;
    private interactButtonPrefab: GameObject;
    private interactButtonRoot: RectTransform;
    // Auto-calculated based on NPC height
    private interactButtonScreenOffset: Vector2 = new Vector2(0, 0);
    private interactButtonReferenceOrtho: number = 3;
    private interactButtonScaleMultiplier: number = 1;
    private interactButtonClampScale: boolean = true;
    private interactButtonMinScale: number = 0.35;
    private interactButtonMaxScale: number = 1.0;
    // Offset multiplier: button will be placed at headPosition + (npcHeight * this multiplier)
    private interactButtonHeightMultiplier: number = 0.20; // 20% of NPC height above head
    private _cachedNpcHeight: number = 0;
    private speechBubblePrefab: GameObject;
    private speechBubbleYOffset: number = 2;
    private dialogueCamera: Camera | null = null;
    private interactionCamera: Camera | null = null;
    private uiToolbar: GameObject | null = null;

    private _interactButtonObject: GameObject;
    private _interactButton: Button;
    private _interactButtonRect: RectTransform;
    private _interactButtonBaseScale: Vector3 | null = null;
    private _isLocalPlayerInside: boolean = false;

    private _speechBubbleObject: GameObject;
    private _canvas: Canvas;

    private _gameplayCamera: Camera | null = null;
    private _cachedGameplayCamera: Camera | null = null;

    private _npcReady: boolean = false;
    private _npcRoot: Transform | null = null;
    private _headOffset: Vector3 = Vector3.zero;
    private _headLocator: HeadLocator | null = null;
    private _characterScale: number = 1.0; // Character scale from ZepetoContext

    protected abstract InitializeNpc(): void;
    protected abstract playDialogueAnimation(): void;
    protected abstract playIdleAnimation(): void;
    protected abstract stopDialogueAnimation(): void;

    protected get isNpcReady(): boolean {
        return this._npcReady;
    }

    Reset() {
        // Dialogue data is managed in the editor window (ZEPETO 2D > Edit NPC Dialogue)
    }

    Awake() {
        this.ResolveGameplayCamera(true);
        this.AutoFindComponents();
    }

    Start() {
        const trigger = this.GetComponent<PlayerTrigger>();
        if (trigger) {
            trigger.delegate = this;
            console.log('[NPCBase] PlayerTrigger delegate assigned.');
        } else {
            console.warn('[NPCBase] PlayerTrigger component not found.');
        }

        this.InitializeNpc();
    }

    private AutoFindComponents() {
        // Auto-find interact button prefab from Resources
        if (!this.interactButtonPrefab) {
            const resourceNames = ['Prefabs/InteractButton(NPC)', 'Prefabs/InteractButton'];
            for (const name of resourceNames) {
                const loaded = Resources.Load<GameObject>(name);
                if (loaded) {
                    this.interactButtonPrefab = loaded;
                    break;
                }
            }
        }

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

        // Auto-find speech bubble prefab (optional - may not exist)
        // Speech bubble is not required, so we skip auto-finding it

        // Auto-find dialogue camera from NPC's children
        if (!this.dialogueCamera) {
            // First try to find in NPC's children
            const dialogueCam = this.gameObject.GetComponentInChildren<Camera>(true);
            if (dialogueCam) {
                this.dialogueCamera = dialogueCam;
            } else {
                // Fallback: try to find by name in scene
                const dialogueCamObj = GameObject.Find('DialogueCamera');
                if (dialogueCamObj) {
                    this.dialogueCamera = dialogueCamObj.GetComponent<Camera>();
                }
            }
        }

        // Auto-find UI toolbar
        if (!this.uiToolbar) {
            const commonNames = ['UIToolbar', 'Toolbar', 'UI'];
            for (const name of commonNames) {
                const found = GameObject.Find(name);
                if (found) {
                    this.uiToolbar = found;
                    break;
                }
            }
        }
    }

    OnPlayerEnter() {
        this._isLocalPlayerInside = true;

        if (!this._npcReady) {
            console.warn('[NPCBase] OnPlayerEnter called before NPC is ready.');
            return;
        }

        if (!this._interactButtonObject) {
            console.log('[NPCBase] OnPlayerEnter -> InstantiateInteractButton()');
            this.InstantiateInteractButton();
        }

        if (this._speechBubbleActive) return;
        this._speechBubbleActive = true;

        if (this._speechBubbleObject) {
            this._speechBubbleObject.SetActive(true);
        }

        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(true);
            console.log('[NPCBase] Interact button activated.');
        }

        this.playDialogueAnimation();
        this.UpdateInteractButton();
    }

    OnPlayerExit() {
        this._isLocalPlayerInside = false;
        this._speechBubbleActive = false;

        if (this._speechBubbleObject) {
            this._speechBubbleObject.SetActive(false);
        }

        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(false);
        }

        this.stopDialogueAnimation();
        this.playIdleAnimation();
    }

    Interact(): void {
        this.ShowDialogueScreen();
    }

    CloseDialogue(): void {
        this._speechBubbleActive = false;

        if (this.dialogueCamera) {
            this.dialogueCamera.gameObject.SetActive(false);
        }

        if (this._cachedGameplayCamera && this._cachedGameplayCamera !== this.dialogueCamera) {
            this._cachedGameplayCamera.gameObject.SetActive(true);
            this._gameplayCamera = this._cachedGameplayCamera;
        }
        this._cachedGameplayCamera = null;

        if (this.uiToolbar) {
            this.uiToolbar.SetActive(true);
        }

        if (this && this.isActiveAndEnabled) {
            this.StartCoroutine(this.ReShowButtonAfterDelay());
        } else {
            console.warn('[NPCBase] Component not active, showing button immediately');
            if (this._interactButtonObject) {
                this._interactButtonObject.SetActive(true);
            }
            this._speechBubbleActive = true;
            if (this._speechBubbleObject) {
                this._speechBubbleObject.SetActive(true);
            }
            this.playDialogueAnimation();
        }
    }

    protected OnNpcReady(config?: NpcReadyConfig) {
        this._npcReady = true;
        this._npcRoot = config?.npcRoot ?? this.transform;
        this._headOffset = config?.headOffset ?? Vector3.zero;
        this._headLocator = config?.headLocator ?? null;
        this._characterScale = config?.characterScale ?? 1.0;

        // Auto-calculate headOffset for SpriteNPC if headLocator is not provided
        // (SpriteNPC doesn't have headLocator, so we can auto-calculate based on SpriteRenderer)
        if (!this._headLocator) {
            const autoHeadOffset = this.CalculateHeadOffset();
            // Only use auto-calculated offset if it's reasonable (not default fallback)
            // or if the provided offset is zero/default
            if (autoHeadOffset.y > 0.1 || this._headOffset.y === 0) {
                this._headOffset = autoHeadOffset;
            }
        }

        this.SetupSpeechBubble();
        this.InstantiateInteractButton();

        if (this._isLocalPlayerInside) {
            console.log('[NPCBase] Local player already inside trigger. Forcing OnPlayerEnter.');
            this.OnPlayerEnter();
        }
    }

    protected getNpcRoot(): Transform | null {
        return this._npcRoot ?? this.transform;
    }

    protected getHeadPosition(): Vector3 {
        if (this._headLocator) {
            return this._headLocator();
        }

        const root = this.getNpcRoot();
        if (root) {
            return Vector3.op_Addition(root.position, this._headOffset);
        }

        return Vector3.op_Addition(this.transform.position, this._headOffset);
    }

    /**
     * Calculate head offset automatically for SpriteNPC based on SpriteRenderer bounds
     * Returns offset from sprite center to top of sprite
     */
    private CalculateHeadOffset(): Vector3 {
        const root = this.getNpcRoot() ?? this.transform;
        
        // Try to find SpriteRenderer
        const spriteRenderer = root.GetComponent<SpriteRenderer>() as SpriteRenderer;
        if (spriteRenderer && spriteRenderer.sprite) {
            const bounds = spriteRenderer.bounds;
            // Head position is at the top of the sprite (center + half height)
            const headY = bounds.size.y * 0.5;
            return new Vector3(0, headY, 0);
        }
        
        // Try children
        const spriteRenderers = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
        if (spriteRenderers.length > 0) {
            let combinedBounds = spriteRenderers[0].bounds;
            for (let i = 1; i < spriteRenderers.length; i++) {
                if (spriteRenderers[i] && spriteRenderers[i].enabled) {
                    combinedBounds.Encapsulate(spriteRenderers[i].bounds);
                }
            }
            const headY = combinedBounds.size.y * 0.5;
            // Calculate offset from root position to top of bounds
            const rootPos = root.position;
            const topY = combinedBounds.max.y;
            const offsetY = topY - rootPos.y;
            return new Vector3(0, offsetY, 0);
        }
        
        // Fallback: use default
        console.warn(`[NPCBase] Could not calculate head offset automatically. Using default (0, 1.5, 0). Root: ${root.name}`);
        return new Vector3(0, 1.5, 0);
    }

    /**
     * Calculate NPC height using the most accurate method available
     * For ZepetoNPC: uses SkinnedMeshRenderer bounds (actual visual height)
     * For SpriteNPC: uses SpriteRenderer bounds
     * Returns actual height without capping to support small characters
     * Note: CharacterController.height is not used as it's a fixed capsule height, not the actual character visual height
     */
    private CalculateNpcHeight(): number {
        const root = this.getNpcRoot() ?? this.transform;
        
        // For ZepetoNPC: use SkinnedMeshRenderer bounds (most accurate - actual visual height)
        const skinnedRenderers = root.GetComponentsInChildren<SkinnedMeshRenderer>(true) as SkinnedMeshRenderer[];
        
        if (skinnedRenderers.length > 0) {
            // ZepetoNPC: use SkinnedMeshRenderer bounds
            let bounds = skinnedRenderers[0].bounds;
            for (let i = 1; i < skinnedRenderers.length; i++) {
                if (skinnedRenderers[i] && skinnedRenderers[i].enabled) {
                    bounds.Encapsulate(skinnedRenderers[i].bounds);
                }
            }
            
            // Get scale from ZepetoContext Transform (Animator may control scale, so use lossyScale which includes animation)
            if (this._characterScale === 1.0) {
                const zepetoCharacter = root.GetComponent<ZepetoCharacter>() as ZepetoCharacter;
                if (zepetoCharacter && zepetoCharacter.Context) {
                    try {
                        const contextTransform = zepetoCharacter.Context.transform;
                        // Use lossyScale as it includes all parent scales and animation effects
                        const contextLossyScale = contextTransform.lossyScale.x;
                        if (contextLossyScale !== 1.0) {
                            this._characterScale = contextLossyScale;
                        }
                    } catch (e) {
                        console.warn(`[NPCBase] Error getting scale from ZepetoContext: ${e}`);
                    }
                }
            }
            
            // Use actual bounds height, but normalize by character scale for accurate comparison
            // bounds.size.y already includes scale, so we divide by scale to get base height
            const boundsHeight = bounds.size.y;
            const normalizedHeight = boundsHeight / this._characterScale;
            
            return normalizedHeight;
        }
        
        // Fallback: try HEAD_UPPER socket distance from root
        // This is less reliable as the multiplier varies by character size
        if (this._headLocator) {
            const headPos = this._headLocator();
            const rootPos = root.position;
            const headToRootDistance = Math.abs(headPos.y - rootPos.y);
            // HEAD_UPPER is at top of head, root is typically at feet/center
            // For Zepeto characters, root to head is roughly 50-60% of total height
            // So multiply by ~1.8 to get approximate full height
            const heightFromSocket = headToRootDistance * 1.8;
            if (heightFromSocket > 0.1) {
                return heightFromSocket;
            }
        }
        
        // For SpriteNPC: use SpriteRenderer
        const spriteRenderers = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
        if (spriteRenderers.length > 0) {
            let bounds = spriteRenderers[0].bounds;
            for (let i = 1; i < spriteRenderers.length; i++) {
                if (spriteRenderers[i] && spriteRenderers[i].enabled) {
                    bounds.Encapsulate(spriteRenderers[i].bounds);
                }
            }
            
            const height = bounds.size.y;
            return height;
        }
        
        // Fallback: try MeshRenderer
        const meshRenderers = root.GetComponentsInChildren<MeshRenderer>(true) as MeshRenderer[];
        if (meshRenderers.length > 0) {
            let bounds = meshRenderers[0].bounds;
            for (let i = 1; i < meshRenderers.length; i++) {
                if (meshRenderers[i] && meshRenderers[i].enabled) {
                    bounds.Encapsulate(meshRenderers[i].bounds);
                }
            }
            
            const height = bounds.size.y;
            return height;
        }
        
        // Final fallback: use default height
        console.warn(`[NPCBase] No renderers found for NPC height calculation. Using default height 1.8. Root: ${root.name}`);
        return 1.8;
    }

    /**
     * Calculate screen space Y offset based on camera distance for consistent button spacing
     */
    private CalculateScreenOffsetY(cameraDistance: number, camera: Camera): number {
        // Base offset in pixels
        const baseOffset = 30;
        
        // Adjust based on camera orthographic size (for 2D cameras)
        if (camera.orthographic) {
            // Scale offset based on orthographic size to maintain consistent visual spacing
            const orthoScale = camera.orthographicSize / this.interactButtonReferenceOrtho;
            return baseOffset * orthoScale;
        } else {
            // For perspective cameras, adjust based on distance
            const distanceScale = cameraDistance / 10.0; // Normalize to ~10 units
            return baseOffset * distanceScale;
        }
    }

    /**
     * Position dialogue camera to show NPC's upper body, slightly to the left of center
     * Target: x = -1.5, y calculated based on NPC type, z = 10 (relative to NPC root position in local space)
     * Rotation is preserved, size is calculated based on NPC size
     */
    private PositionDialogueCamera(): void {
        if (!this.dialogueCamera) return;

        const root = this.getNpcRoot() ?? this.transform;
        
        // Calculate NPC bounds for size calculation
        let bounds: Bounds | null = null;
        let isZepetoNPC = false;
        
        // Try SkinnedMeshRenderer first (ZepetoNPC)
        const skinnedRenderers = root.GetComponentsInChildren<SkinnedMeshRenderer>(true) as SkinnedMeshRenderer[];
        if (skinnedRenderers.length > 0) {
            isZepetoNPC = true;
            bounds = skinnedRenderers[0].bounds;
            for (let i = 1; i < skinnedRenderers.length; i++) {
                if (skinnedRenderers[i] && skinnedRenderers[i].enabled) {
                    bounds.Encapsulate(skinnedRenderers[i].bounds);
                }
            }
        } else {
            // Try SpriteRenderer (SpriteNPC)
            const spriteRenderers = root.GetComponentsInChildren<SpriteRenderer>(true) as SpriteRenderer[];
            if (spriteRenderers.length > 0) {
                bounds = spriteRenderers[0].bounds;
                for (let i = 1; i < spriteRenderers.length; i++) {
                    if (spriteRenderers[i] && spriteRenderers[i].enabled) {
                        bounds.Encapsulate(spriteRenderers[i].bounds);
                    }
                }
            }
        }

        // Calculate Y position based on NPC type
        let cameraY = 1.0; // Default for SpriteNPC
        if (isZepetoNPC && bounds) {
            // Adjust camera Y position based on character scale
            if (this._characterScale < 1.0) {
                // Small character: lower camera (target: 1.9 from current ~2.864)
                cameraY = 1.9;
            } else {
                // Normal character (scale >= 1.0): raise camera (target: 4.3 from current ~2.5)
                cameraY = 4.3;
            }
        }

        // Camera position in local space relative to NPC root
        // Target: x = -1.5, y = calculated, z = 10
        const cameraTransform = this.dialogueCamera.transform;
        const originalRotation = cameraTransform.localRotation; // Preserve rotation
        cameraTransform.localPosition = new Vector3(-1.5, cameraY, 10.0);
        cameraTransform.localRotation = originalRotation; // Restore rotation

        // Calculate orthographic size based on NPC type
        if (this.dialogueCamera.orthographic && bounds) {
            if (isZepetoNPC) {
                // For ZepetoNPC: calculate size to frame upper body nicely
                const upperBodyHeight = bounds.size.y * 0.45;
                const aspect = this.dialogueCamera.aspect;
                
                // Size should be large enough to show upper body with some padding
                const heightBasedSize = upperBodyHeight * 0.6;
                const widthBasedSize = bounds.size.x / aspect * 0.5;
                
                this.dialogueCamera.orthographicSize = Math.max(heightBasedSize, widthBasedSize);
            } else {
                // For SpriteNPC: use fixed size of 0.7
                this.dialogueCamera.orthographicSize = 0.7;
            }
        } else if (this.dialogueCamera.orthographic) {
            // Fallback: use default size
            this.dialogueCamera.orthographicSize = isZepetoNPC ? 1.0 : 0.7;
        }

    }

    private LoadDialogueData(): { npcName: string; dialogueText: string; questions: string[]; answers: string[] } | null {
        // Load from central dictionary (NpcDialogueData.ts)
        if (!this.dialogueId || this.dialogueId.trim() === '') {
            console.error(`[NPCBase] dialogueId is empty! Please set a dialogue ID in the inspector or use the editor window (ZEPETO 2D > Edit NPC Dialogue) to create dialogue data.`);
            return null;
        }

        try {
            const dialogueData = GetDialogueData(this.dialogueId);
            if (dialogueData) {
                const questions = dialogueData.dialogueOptions.map((opt: DialogueOption) => opt.question);
                const answers = dialogueData.dialogueOptions.map((opt: DialogueOption) => opt.answer);
                return {
                    npcName: dialogueData.npcName,
                    dialogueText: dialogueData.dialogueText,
                    questions: questions,
                    answers: answers
                };
            } else {
                console.error(`[NPCBase] Dialogue data not found for ID '${this.dialogueId}'. Please use the editor window (ZEPETO 2D > Edit NPC Dialogue) to create dialogue data.`);
                return null;
            }
        } catch (error) {
            console.error(`[NPCBase] Failed to load dialogue data for ID '${this.dialogueId}':`, error);
            console.error(`[NPCBase] Please use the editor window (ZEPETO 2D > Edit NPC Dialogue) to create dialogue data.`);
            return null;
        }
    }

    protected ShowDialogueScreen(): void {
        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(false);
        }

        const gameplayCamera = this.ResolveGameplayCamera();
        if (gameplayCamera && gameplayCamera !== this.dialogueCamera) {
            this._cachedGameplayCamera = gameplayCamera;
            if (gameplayCamera.gameObject.activeSelf) {
                gameplayCamera.gameObject.SetActive(false);
            }
        } else {
            this._cachedGameplayCamera = null;
        }

        if (this.dialogueCamera) {
            // Auto-position camera to show NPC's upper body, slightly to the left
            this.PositionDialogueCamera();
            this.dialogueCamera.gameObject.SetActive(true);
        }

        if (this.dialoguePanel) {
            this.dialoguePanel.SetActive(true);
            if (this.uiToolbar) {
                this.uiToolbar.SetActive(false);
            }

            const npcTalk = this.dialoguePanel.GetComponentInChildren<NpcTalk>();
            if (npcTalk) {
                const dialogueData = this.LoadDialogueData();
                if (!dialogueData) {
                    console.warn('[NPCBase] No dialogue data available!');
                    return;
                }
                npcTalk.SetDialogueData(
                    dialogueData.npcName,
                    dialogueData.dialogueText,
                    dialogueData.questions,
                    dialogueData.answers
                );
                npcTalk.InitializeDialogue(this);
            } else {
                console.warn('[NPCBase] NpcTalk component not found in dialogue panel!');
            }
        } else {
            console.warn('[NPCBase] dialoguePanel is null! Please assign it in the inspector.');
        }
    }

    private *ReShowButtonAfterDelay() {
        yield new WaitForEndOfFrame();
        yield new WaitForEndOfFrame();

        this._speechBubbleActive = true;

        if (this._speechBubbleObject) {
            this._speechBubbleObject.SetActive(true);
        }

        if (this._interactButtonObject) {
            this._interactButtonObject.SetActive(true);
        }

        this.playDialogueAnimation();
    }

    private InstantiateInteractButton() {
        if (this._interactButtonObject || !this.interactButtonPrefab) {
            return;
        }

        if (!this.interactButtonRoot) {
            console.warn('[NPCBase] interactButtonRoot is not assigned. Screen space button cannot be created.');
            return;
        }

        this._interactButtonObject = Object.Instantiate(this.interactButtonPrefab, this.interactButtonRoot) as GameObject;

        this._interactButtonRect = this._interactButtonObject.GetComponent<RectTransform>();
        this._interactButton = this._interactButtonObject.GetComponentInChildren<Button>();
        this._interactButtonBaseScale = this._interactButtonRect ? this._interactButtonRect.localScale : new Vector3(1, 1, 1);

        if (this._interactButton) {
            this._interactButton.onClick.AddListener(() => {
                this.Interact();
            });
            console.log('[NPCBase] ScreenSpace interact button instantiated.');
        } else {
            console.warn('[NPCBase] Button component not found in interactButtonPrefab!');
        }

        this._interactButtonObject.SetActive(false);
    }

    Update() {
        if (this._speechBubbleActive) {
            this.UpdateSpeechBubble();
        }

        if (this._interactButtonObject && this._interactButtonObject.activeSelf) {
            this.UpdateInteractButton();
        }
    }

    private UpdateSpeechBubble() {
        if (!this._speechBubbleObject) return;

        this._speechBubbleObject.transform.position = Vector3.op_Addition(
            this.getHeadPosition(),
            new Vector3(0, this.speechBubbleYOffset, 0)
        );

        if (!this._canvas?.worldCamera) {
            this.AssignWorldCamera(this._canvas);
        }

        this.UpdateCanvasRotation();
    }

    private UpdateCanvasRotation() {
        if (!this._canvas) return;

        const lookCamera = this.GetFallbackCamera();
        if (!lookCamera) return;

        this._canvas.transform.LookAt(lookCamera.transform);
        this._canvas.transform.Rotate(0, 180, 0);
    }

    private UpdateInteractButton() {
        if (!this._interactButtonRect || !this.interactButtonRoot) {
            return;
        }

        const gameplayCamera = this.ResolveGameplayCamera();
        if (!gameplayCamera) {
            return;
        }

        // Calculate NPC height if not cached (recalculate to handle small characters)
        // This returns normalized height (base height without scale)
        this._cachedNpcHeight = this.CalculateNpcHeight();

        // Calculate world position: head position + (NPC height * multiplier)
        // Adjust button position based on character scale
        let multiplier = this.interactButtonHeightMultiplier;
        
        if (this._characterScale < 1.0) {
            // Small character: use much smaller multiplier
            // Scale down multiplier significantly to lower button position
            multiplier = this.interactButtonHeightMultiplier * 0.1; // Much lower for small characters
        } else if (this._characterScale >= 1.0) {
            // Normal character (scale 1.0): raise the button slightly
            multiplier = this.interactButtonHeightMultiplier * 1.2; // Raise by 20%
        }
        
        // Apply scale to get actual visual height offset (scale is proportional to offset)
        const yOffset = this._cachedNpcHeight * multiplier * this._characterScale;
        const headPos = this.getHeadPosition();
        const worldPos = Vector3.op_Addition(headPos, new Vector3(0, yOffset, 0));
        const screenPoint = gameplayCamera.WorldToScreenPoint(worldPos);
        
        // For small characters, apply additional screen-space offset to lower button
        if (this._characterScale < 1.0) {
            // Convert world offset to screen space and subtract more
            // Target: move from current position (around 62) to -66, so need to subtract ~128 pixels
            const screenOffsetY = -128.0; // Negative to move down
            screenPoint.y = screenPoint.y + screenOffsetY;
        }

        const uiCanvas = this.interactButtonRoot.GetComponentInParent<Canvas>();
        let referenceCamera: Camera = null;
        if (uiCanvas && uiCanvas.renderMode !== RenderMode.ScreenSpaceOverlay) {
            referenceCamera = uiCanvas.worldCamera ?? gameplayCamera;
        }

        // Calculate screen offset based on camera distance (for consistent button spacing)
        const cameraDistance = Vector3.Distance(gameplayCamera.transform.position, worldPos);
        const screenOffsetY = this.CalculateScreenOffsetY(cameraDistance, gameplayCamera);
        const screenOffset = new Vector2(0, screenOffsetY);

        const localPoint = $ref(new Vector2(0, 0));
        if (RectTransformUtility.ScreenPointToLocalPointInRectangle(this.interactButtonRoot, new Vector2(screenPoint.x, screenPoint.y), referenceCamera, localPoint)) {
            const targetAnchored = Vector2.op_Addition($unref(localPoint), screenOffset);
            this._interactButtonRect.anchoredPosition = targetAnchored;
        }

        if (this._interactButtonRect) {
            let scale = Mathf.Max(0.0001, this.interactButtonScaleMultiplier);
            if (gameplayCamera.orthographic) {
                const currentOrtho = Math.max(0.001, gameplayCamera.orthographicSize);
                const reference = Math.max(0.001, this.interactButtonReferenceOrtho);
                scale *= reference / currentOrtho;
            }

            if (this.interactButtonClampScale) {
                scale = Mathf.Clamp(scale, this.interactButtonMinScale, this.interactButtonMaxScale);
            }

            const baseScale = this._interactButtonBaseScale ?? new Vector3(1, 1, 1);
            this._interactButtonRect.localScale = new Vector3(baseScale.x * scale, baseScale.y * scale, baseScale.z);
        }
    }

    private SetupSpeechBubble() {
        if (this._speechBubbleObject || !this.speechBubblePrefab) {
            return;
        }

        const parent = this.getNpcRoot();
        this._speechBubbleObject = Object.Instantiate(this.speechBubblePrefab) as GameObject;
        this._speechBubbleObject.transform.SetParent(parent ?? this.transform, false);
        this._speechBubbleObject.transform.position = Vector3.op_Addition(
            this.getHeadPosition(),
            new Vector3(0, this.speechBubbleYOffset, 0)
        );

        this._canvas = this._speechBubbleObject.GetComponent<Canvas>();
        this.AssignWorldCamera(this._canvas);
        this._speechBubbleObject.SetActive(false);
    }

    private AssignWorldCamera(canvas: Canvas | null) {
        if (!canvas) {
            return;
        }

        const worldCamera = this.GetFallbackCamera();
        if (worldCamera) {
            canvas.worldCamera = worldCamera;
        }
    }

    private GetFallbackCamera(): Camera | null {
        if (this.dialogueCamera?.gameObject.activeSelf) {
            return this.dialogueCamera;
        }

        return this.ResolveGameplayCamera();
    }

    protected ResolveGameplayCamera(force: boolean = false): Camera | null {
        if (!force && this._gameplayCamera && this._gameplayCamera.gameObject.activeInHierarchy) {
            return this._gameplayCamera;
        }

        if (this.interactionCamera) {
            this._gameplayCamera = this.interactionCamera;
            return this._gameplayCamera;
        }

        const follow2D = Object.FindObjectOfType<CameraFollow2D>();
        if (follow2D) {
            const cam = follow2D.GetComponent<Camera>();
            if (cam) {
                this._gameplayCamera = cam;
                return this._gameplayCamera;
            }
        }

        const mainCam = Camera.main;
        if (mainCam) {
            this._gameplayCamera = mainCam;
            return this._gameplayCamera;
        }

        this._gameplayCamera = null;
        return null;
    }
}