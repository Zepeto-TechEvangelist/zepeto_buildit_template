import {
    CharacterState,
    KnowSockets,
    SpawnInfo,
    ZepetoCharacter,
    ZepetoCharacterCreator
} from 'ZEPETO.Character.Controller';
import { ZepetoContext } from 'Zepeto';
import { AnimationClip, CharacterController, Quaternion, Rigidbody, Vector3, SkinnedMeshRenderer, WaitForEndOfFrame } from 'UnityEngine';
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
                console.log('[ZepetoNPC] StateMachine stopped');
            } catch (error) {
                console.warn('[ZepetoNPC] Failed to stop state machine:', error);
            }

            stateMachine.constraintStateAnimation = true;
            console.log('[ZepetoNPC] constraintStateAnimation set to true in ApplyCharacterPhysicsSettings');
        }

        try {
            this._npc.ChangeStateAnimation(CharacterState.Idle);
            console.log('[ZepetoNPC] ChangeStateAnimation(Idle) called in ApplyCharacterPhysicsSettings');
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
        console.log('[ZepetoNPC] playIdleAnimation() called');
        
        if (!this._npc) {
            console.warn('[ZepetoNPC] playIdleAnimation: _npc is null');
            return;
        }
        
        console.log('[ZepetoNPC] idleAnimation:', this.idleAnimation ? this.idleAnimation.name : 'null');
        
        if (this.idleAnimation) {
            // SetGesture를 사용하려면 constraintStateAnimation을 해제하고 Gesture 상태로 전환해야 함
            const stateMachine = this._npc.StateMachine;
            const wasConstrained = stateMachine ? stateMachine.constraintStateAnimation : false;
            
            console.log('[ZepetoNPC] StateMachine exists:', !!stateMachine);
            console.log('[ZepetoNPC] constraintStateAnimation (before):', wasConstrained);
            
            if (stateMachine) {
                stateMachine.constraintStateAnimation = false;
                console.log('[ZepetoNPC] constraintStateAnimation set to false');
            }
            
            try {
                // Gesture 상태로 먼저 전환
                console.log('[ZepetoNPC] Changing to Gesture state before SetGesture');
                this._npc.ChangeStateAnimation(CharacterState.Gesture);
                
                // 약간의 지연 후 SetGesture 호출 (상태 전환이 완료될 시간을 줌)
                this.StartCoroutine(this.SetGestureAfterStateChange(this.idleAnimation));
            } catch (error) {
                console.error('[ZepetoNPC] Failed to change to Gesture state:', error);
                // 실패 시 바로 SetGesture 시도
                try {
                    this._npc.SetGesture(this.idleAnimation);
                    console.log('[ZepetoNPC] SetGesture called directly (fallback)');
                } catch (gestureError) {
                    console.error('[ZepetoNPC] Failed to set idle animation:', gestureError);
                }
            }
            
            // 제약을 복원하지 않음 - Gesture가 계속 재생되도록 false로 유지
            console.log('[ZepetoNPC] constraintStateAnimation will remain false to allow gesture animation');
        } else {
            console.log('[ZepetoNPC] No idleAnimation assigned, using default Idle state');
            // idleAnimation이 없으면 기본 Idle 상태로 전환
            try {
                this._npc.ChangeStateAnimation(CharacterState.Idle);
                console.log('[ZepetoNPC] ChangeStateAnimation(Idle) called successfully');
            } catch (error) {
                console.error('[ZepetoNPC] Failed to set idle state:', error);
            }
        }
    }

    private *SetGestureAfterStateChange(animation: AnimationClip) {
        yield new WaitForEndOfFrame();
        try {
            console.log('[ZepetoNPC] Calling SetGesture with:', animation.name);
            this._npc.SetGesture(animation);
            console.log('[ZepetoNPC] SetGesture called successfully after state change');
        } catch (error) {
            console.error('[ZepetoNPC] Failed to set gesture after state change:', error);
        }
    }


    protected stopDialogueAnimation(): void {
        if (!this._npc) return;
        this._npc.CancelGesture();
    }
}