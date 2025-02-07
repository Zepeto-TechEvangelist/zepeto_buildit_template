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
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Pendulum's initial rotation.
    private initialRotation: Quaternion;
    // Instance of TrapManager.
    private trapManagerInstance: TrapManager;

    Awake() {
        // Initialize initialRotation with the pendulum's current localRotation.
        this.initialRotation = this.transform.localRotation;
    }

    Start() {
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Initialize trapManagerInstance.
        this.trapManagerInstance = TrapManager.instance;
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
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // If the character collided with the pendulum, teleport it to the current checkpoint.
        if (this.trapManagerInstance) {
            this.trapManagerInstance.TeleportCharacter();
        }
    }

}