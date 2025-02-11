import { Collider, Mathf, Quaternion, Time } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapPendulumScript extends ZepetoScriptBehaviour {

    // Pendulum's amplitude.
    @SerializeField() private amplitude: number = 30;
    // Pendulum's moving speed.
    @SerializeField() private speed: number = 2;
    // Whether the character will teleport to the current checkpoint when it collides with the pendulum.
    @SerializeField() private enableKill: bool = true;
    // Pendulum's initial rotation.
    private initialRotation: Quaternion;
   

    Awake() {
        TrapManager.instance;
        
        // Initialize initialRotation with the pendulum's current localRotation.
        this.initialRotation = this.transform.localRotation;
    }

    Update() {
        // Get the current time.
        const t = Time.time;
        // Calculate the swinging angle of the pendulum.
        const angle = this.amplitude * Mathf.Sin(this.speed * t);
        // Multiply initialiRotation with the swinging angle to get the pendulum's new rotation relative to its original rotation.
        // Assign the calculated rotation to the pendulum's local rotation.
        this.transform.localRotation = Quaternion.op_Multiply(this.initialRotation, Quaternion.Euler(angle, 0, 0));
    }

    OnTriggerEnter(collider: Collider) {
        // If enableKill is disabled, return.
        if (!this.enableKill) {
            return;
        }
        
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        let zepetoCharacter = TrapManager.instance.zepetoCharacter;
        if (zepetoCharacter === null || (zepetoCharacter && collider.gameObject !== zepetoCharacter.gameObject)) {
            return;
        }
        
        TrapManager.instance?.TeleportCharacter();
    }

}