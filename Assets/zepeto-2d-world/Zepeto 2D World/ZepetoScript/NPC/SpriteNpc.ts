import { Transform, Vector3 } from 'UnityEngine';
import NpcBase from './NpcBase';

export default class SpriteNPC extends NpcBase {

    @SerializeField()
    @Tooltip("Sprite root transform (auto-found if not assigned)")
    private spriteRoot: Transform;

    @SerializeField()
    @Tooltip("Head offset from sprite root (auto-calculated if (0,0,0))")
    private headOffset: Vector3 = Vector3.zero;

    protected InitializeNpc(): void {
        const root = this.spriteRoot ?? this.transform;

        this.OnNpcReady({
            npcRoot: root,
            headOffset: this.headOffset
        });
    }

    protected playDialogueAnimation(): void {
        // No animation for sprite-based NPCs.
    }

    protected playIdleAnimation(): void {
        // No animation for sprite-based NPCs.
    }

    protected stopDialogueAnimation(): void {
        // No animation for sprite-based NPCs.
    }
}