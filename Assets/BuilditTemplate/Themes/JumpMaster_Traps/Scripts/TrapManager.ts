import { GameObject, Quaternion, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class TrapManager extends ZepetoScriptBehaviour {
    
    // Most recent checkpoint.
    private currentCheckpoint: Vector3 = new Vector3(0, 0, 0);
    
    // Current player's ZepetoCharacter.
    @HideInInspector() public zepetoCharacter: ZepetoCharacter;

    
    /* Singleton */
    private static m_instance: TrapManager = null;
    public static get instance(): TrapManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<TrapManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(TrapManager.name).AddComponent<TrapManager>();
            }
        }
        return this.m_instance;
    }
    private Awake() {
        if (TrapManager.m_instance !== null && TrapManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            TrapManager.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    private Destroy() {
        if (TrapManager.m_instance == this)
            TrapManager.m_instance = null;
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