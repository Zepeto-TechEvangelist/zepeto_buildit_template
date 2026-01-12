import {
    CharacterState,
    KnowSockets,
    SpawnInfo,
    ZepetoCharacter,
    ZepetoCharacterCreator
} from 'ZEPETO.Character.Controller';
import { ZepetoContext } from 'Zepeto';
import { AnimationClip, CharacterController, Quaternion, Rigidbody, Vector3, SkinnedMeshRenderer } from 'UnityEngine';
import NpcBase from './NpcBase';

export default class ZepetoNPC extends NpcBase {

    @SerializeField()
    private zepetoId: string = 'zepeto';

    @SerializeField()
    private npcSize: Vector3 = new Vector3(1, 1, 1);

    @SerializeField()
    private disableCharacterController: boolean = true;

    @Header("Animations")
    @Tooltip('Animation played while showing a speech bubble')
    public dialogueAnimations: AnimationClip[];

    @Tooltip('Animation played while standing still')
    public idleAnimation: AnimationClip;

    private _npc: ZepetoCharacter | null = null;

    protected InitializeNpc(): void {
        const spawnInfo = new SpawnInfo();
        spawnInfo.position = this.transform.position;
        spawnInfo.rotation = this.transform.rotation;

        ZepetoCharacterCreator.CreateByZepetoId(this.zepetoId, spawnInfo,
            (character: ZepetoCharacter) => {
                this._npc = character;
                console.log('[ZepetoNPC] NPC created:', this._npc?.gameObject?.name);

                this.transform.SetParent(this._npc.transform);
                this.transform.localPosition = Vector3.zero;
                this.transform.localRotation = Quaternion.identity;

                if (this._npc?.gameObject) {
                    const resolvedScale = this.ResolveNpcScale();
                    this._npc.gameObject.transform.localScale = resolvedScale;

                    this.ApplyCharacterPhysicsSettings();
                }

                const headLocator = () => {
                    const socket = this._npc?.GetSocket(KnowSockets.HEAD_UPPER);
                    if (socket) {
                        return socket.position;
                    }

                    return this._npc?.transform.position ?? this.transform.position;
                };

                // Get scale from ZepetoContext Transform (Animator may control scale, so use lossyScale which includes animation)
                const getCharacterScale = () => {
                    let scale = 1.0;
                    
                    if (this._npc && this._npc.Context) {
                        try {
                            const contextTransform = this._npc.Context.transform;
                            // Use lossyScale as it includes all parent scales and animation effects
                            const contextLossyScale = contextTransform.lossyScale.x;
                            if (contextLossyScale !== 1.0) {
                                scale = contextLossyScale;
                            }
                        } catch (e) {
                            console.warn(`[ZepetoNPC] Error getting scale from ZepetoContext: ${e}`);
                        }
                    }
                    
                    return scale;
                };
                
                // Get scale immediately (Context might be ready)
                const characterScale = getCharacterScale();
                console.log(`[ZepetoNPC] Initial character scale: ${characterScale.toFixed(4)}`);
                
                // If scale is still 1.0, Context might not be ready yet
                // We'll recalculate it later when CalculateNpcHeight is called

                this.OnNpcReady({
                    npcRoot: this._npc?.transform,
                    headLocator,
                    characterScale: characterScale
                });

                this.playIdleAnimation();
            });
    }

    private ResolveNpcScale(): Vector3 {
        if (!this.npcSize) {
            return new Vector3(1, 1, 1);
        }

        if (this.npcSize.x === 0 && this.npcSize.y === 0 && this.npcSize.z === 0) {
            console.warn('[ZepetoNPC] npcSize is (0,0,0). Falling back to Vector3(1,1,1).');
            this.npcSize = new Vector3(1, 1, 1);
        }

        return this.npcSize;
    }

    private ApplyCharacterPhysicsSettings(): void {
        if (!this._npc || !this.disableCharacterController) {
            return;
        }

        const controller: CharacterController = this._npc.characterController;
        if (controller && controller.enabled) {
            controller.enabled = false;
        }

        const rigidbody = this._npc.GetComponent<Rigidbody>();
        if (rigidbody) {
            rigidbody.useGravity = false;
            rigidbody.isKinematic = true;
            rigidbody.velocity = Vector3.zero;
        }

        try {
            this._npc.motionState.gravity = 0;
        } catch (error) {
            console.warn('[ZepetoNPC] Failed to zero motion gravity:', error);
        }

        const stateMachine = this._npc.StateMachine;
        if (stateMachine) {
            try {
                stateMachine.Stop();
            } catch (error) {
                console.warn('[ZepetoNPC] Failed to stop state machine:', error);
            }

            stateMachine.constraintStateAnimation = true;
        }

        try {
            this._npc.ChangeStateAnimation(CharacterState.Idle);
        } catch (error) {
            console.warn('[ZepetoNPC] Unable to force idle animation:', error);
        }
    }

    protected playDialogueAnimation(): void {
        if (!this._npc) return;
        if (this.dialogueAnimations && this.dialogueAnimations.length > 0) {
            this._npc.SetGesture(this.dialogueAnimations[0]);
        }
    }

    protected playIdleAnimation(): void {
        if (!this._npc) return;
        if (this.idleAnimation) {
            this._npc.SetGesture(this.idleAnimation);
        }
    }

    protected stopDialogueAnimation(): void {
        if (!this._npc) return;
        this._npc.CancelGesture();
    }
}