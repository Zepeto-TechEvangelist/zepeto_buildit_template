import { GameObject, Quaternion, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import SceneManager from '../../../Modules/Scripts/SceneManager';
import { Checkpoint } from './Checkpoint';
import CheckpointPlatformScript from './CheckpointPlatformScript';

export default class TrapManager extends ZepetoScriptBehaviour {
    
    // Most recent checkpoint.
    public currentCheckpoint: Checkpoint = new Checkpoint(-1, Vector3.zero);
    
    private fallAreaPosition: number = -20;
    
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
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        
            this.currentCheckpoint.position = this.zepetoCharacter.transform.position;
        });

        this.fallAreaPosition = SceneManager.instance.fallAreaPosition;
    }

    Update() {
        //If zepetoCharacter's y position goes below -20, teleport it to the most recent checkpoint.
        if (this.zepetoCharacter !== null) {
            if (this.zepetoCharacter && this.zepetoCharacter.transform.position.y < this.fallAreaPosition) {
                this.TeleportCharacter();
            }
        }
    }

    // Method to update the most recent checkpoint.
    UpdateCheckpoint(newCheckpoint: Vector3) {
        this.currentCheckpoint.position = newCheckpoint;
        SceneManager.instance.teleporter.destination = newCheckpoint;
    }

    
    public VisitCheckpoint(checkpoint: Checkpoint) {
        if (this.currentCheckpoint.index <= checkpoint.index) {
            this.currentCheckpoint = checkpoint;
            SceneManager.instance.teleporter.destination = checkpoint.position;
        }
    }
    
    // Method to teleport the character to the most recent checkpoint.
    TeleportCharacter() {
        if (this.zepetoCharacter) {
            // Change zepetoCharacter's position to the most recent checkpoint.
            this.zepetoCharacter.transform.position = this.currentCheckpoint.position;
            // Teleport the character to the most recent checkpoint.
            this.zepetoCharacter.Teleport(this.currentCheckpoint.position, new Quaternion(0, 0, 0, 0));
        }
    }

}