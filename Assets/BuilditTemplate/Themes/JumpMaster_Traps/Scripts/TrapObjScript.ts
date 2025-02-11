import { Collider } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapObjScript extends ZepetoScriptBehaviour {
    
    Awake() {
        TrapManager.instance;   // Autogenerate if missing
    }
    
    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        let zepetoCharacter = TrapManager.instance.zepetoCharacter;
        if (zepetoCharacter === null || (zepetoCharacter && collider.gameObject !== zepetoCharacter.gameObject)) {
            return;
        }
        TrapManager.instance?.TeleportCharacter();
    }

}