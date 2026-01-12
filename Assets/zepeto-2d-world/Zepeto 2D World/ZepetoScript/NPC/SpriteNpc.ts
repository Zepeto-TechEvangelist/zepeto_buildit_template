import { Transform, Vector3 } from 'UnityEngine';
import NpcBase from './NpcBase';

export default class SpriteNPC extends NpcBase {

    @SerializeField()
    private spriteRoot: Transform;

    @SerializeField()
    private headOffset: Vector3 = new Vector3(0, 1.5, 0);

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