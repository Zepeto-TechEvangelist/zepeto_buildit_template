import { Collider, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';
import { Checkpoint } from './Checkpoint';

export default class CheckpointPlatformScript extends ZepetoScriptBehaviour {

    public index: int;
    // Whether the checkpoint has been visited.
    private visited: bool;
    
    Awake() {
        TrapManager.instance;   // Autogenerate if missing
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        let zepetoCharacter = TrapManager.instance.zepetoCharacter;
        if (zepetoCharacter === null || (zepetoCharacter && collider.gameObject !== zepetoCharacter.gameObject)) {
            return;
        }
        
        if (this.visited) return;
        this.visited = true;
        
        TrapManager.instance.VisitCheckpoint(new Checkpoint(this.index, this.transform.position));
    }

}
