import { Collider } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapObjScript extends ZepetoScriptBehaviour {

    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Instance of TrapManager.
    private trapManagerInstance: TrapManager;

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Initialize trapManagerInstance.
        this.trapManagerInstance = TrapManager.instance;
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // If zepetoCharacter collided with the trap, teleport it to the most recent checkpoint.
        if (this.trapManagerInstance) {
            this.trapManagerInstance.TeleportCharacter();
        }
    }

}