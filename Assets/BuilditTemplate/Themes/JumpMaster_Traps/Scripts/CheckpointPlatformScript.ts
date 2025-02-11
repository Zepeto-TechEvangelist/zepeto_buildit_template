import { Collider } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class CheckpointPlatformScript extends ZepetoScriptBehaviour {

    // Whether the checkpoint has been visited.
    private isActive: bool = false;
    
    Awake() {
        TrapManager.instance;   // Autogenerate if missing
    }
    

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        let zepetoCharacter = TrapManager.instance.zepetoCharacter;
        if (zepetoCharacter === null || (zepetoCharacter && collider.gameObject !== zepetoCharacter.gameObject)) {
            return;
        }

        // If the current platform is inactive, activate it and update the most recent checkpoint.
        if (!this.isActive) {
            this.isActive = true;
            
            TrapManager.instance.UpdateCheckpoint(this.transform.position);
        }
    }

}