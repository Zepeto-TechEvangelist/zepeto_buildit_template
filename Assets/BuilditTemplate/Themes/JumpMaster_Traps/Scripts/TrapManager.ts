import { GameObject, Quaternion, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class TrapManager extends ZepetoScriptBehaviour {

    @Header("TrapManager must be placed in the World in order to use Checkpoint and Trap objects.")
    @SerializeField() private note: String; // Dummy variable for adding a note.
    // Singleton instance of TrapManager.
    public static instance: TrapManager;
    // Most recent checkpoint.
    private currentCheckpoint: Vector3;
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;

    Awake() {
        // If there's no instance created, initialize it with the current instance.
        if (TrapManager.instance == null) {
            TrapManager.instance = this;
        } else {
            // Otherwise, destroy the current instance.
            GameObject.Destroy(this);
        }

        // Set the initial checkpoint to (0, 0, 0).
        this.currentCheckpoint = new Vector3(0, 0, 0);
    }

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });
    }

    Update() {
        // If zepetoCharacter's y position goes below -20, teleport it to the most recent checkpoint.
        if (this.zepetoCharacter !== null) {
            if (this.zepetoCharacter && this.zepetoCharacter.transform.position.y < -20) {
                this.TeleportCharacter();
            }
        }
    }

    // Method to update the most recent checkpoint.
    UpdateCheckpoint(newCheckpoint: Vector3) {
        this.currentCheckpoint = newCheckpoint;
    }

    // Method to teleport the character to the most recent checkpoint.
    TeleportCharacter() {
        if (this.zepetoCharacter) {
            // Change zepetoCharacter's position to the most recent checkpoint.
            this.zepetoCharacter.transform.position = this.currentCheckpoint;
            // Teleport the character to the most recent checkpoint.
            this.zepetoCharacter.Teleport(this.currentCheckpoint, new Quaternion(0, 0, 0, 0));
        }
    }

}