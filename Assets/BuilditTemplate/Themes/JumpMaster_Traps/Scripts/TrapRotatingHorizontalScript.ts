import { Collider, Quaternion, Rigidbody, Time } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapRotatingHorizontalScript extends ZepetoScriptBehaviour {

    // Speed of rotation of the trap.
    @SerializeField() private rotationSpeed: number = 100;
    // Trap's Rigidbody.
    private objRigidbody: Rigidbody;
    
    Awake() {
        TrapManager.instance;
        
        // Find the Rigidbody of the trap and initialize objRigidbody.
        this.objRigidbody = this.GetComponent<Rigidbody>();
    }

    
    FixedUpdate() {
        // Amount of rotation to apply this frame.
        const deltaRotation = Quaternion.Euler(0, this.rotationSpeed * Time.fixedDeltaTime, 0);
        // Combine the trap's current rotation with deltaRotation.
        const newPlatformRotation = Quaternion.op_Multiply(this.objRigidbody.rotation, deltaRotation);
        // Apply the new rotation to the trap.
        this.objRigidbody.MoveRotation(newPlatformRotation);
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