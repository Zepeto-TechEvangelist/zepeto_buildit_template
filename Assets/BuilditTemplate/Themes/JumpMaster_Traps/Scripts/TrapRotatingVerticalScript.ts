import { Collider, Quaternion, Rigidbody, Time } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapRotatingVerticalScript extends ZepetoScriptBehaviour {

    // Speed of rotation of the trap.
    @SerializeField() private rotationSpeed: number = 100;
    // Trap's Rigidbody.
    private objRigidbody: Rigidbody;
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Instance of TrapManager.
    private trapManagerInstance: TrapManager;

    Awake() {
        // Find the Rigidbody of the trap and initialize objRigidbody.
        this.objRigidbody = this.GetComponent<Rigidbody>();
    }

    Start() {   
        // Initialize zepetoCharacter. 
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Initialize trapManagerInstance.
        this.trapManagerInstance = TrapManager.instance;
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
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // If zepetoCharacter collided with the trap, teleport it to the most recent checkpoint.
        if (this.trapManagerInstance) {
            this.trapManagerInstance.TeleportCharacter();
        }
    }

}