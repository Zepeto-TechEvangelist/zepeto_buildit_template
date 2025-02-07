import { Collider } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class CheckpointPlatformScript extends ZepetoScriptBehaviour {

    // Whether the checkpoint has been visited.
    private isActive: bool = false;
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Instance of TrapManager.
    private trapManagerInstance: TrapManager;

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Initialize worldManagerInstance.
        this.trapManagerInstance = TrapManager.instance;
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // If the current platform is inactive, activate it and update the most recent checkpoint.
        if (!this.isActive) {
            this.isActive = true;
            if (this.trapManagerInstance) {
                this.trapManagerInstance.UpdateCheckpoint(this.transform.position);
            }
        }
    }

}