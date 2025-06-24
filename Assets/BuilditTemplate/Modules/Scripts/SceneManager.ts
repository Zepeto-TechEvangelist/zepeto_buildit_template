import { BoxCollider, GameObject, Object, Vector3, Physics } from 'UnityEngine';
import { CharacterState, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers, ZepetoScreenButton } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper, ZepetoScreenOrientation } from 'ZEPETO.World';
import {UnityEvent} from "UnityEngine.Events";
import TeleportArea from './TeleportArea';

export default class SceneManager extends ZepetoScriptBehaviour {


    @Header("Character Settings")

    @Tooltip("Adjust the walking speed of the ZEPETO character. The default value is 2.")
    public walkSpeed: number = 2;

    @Tooltip("Adjust the running speed of the ZEPETO character. The default value is 5.")
    public runSpeed: number = 5;

    @Tooltip("Set the standard jump power. The default value is 13.")
    public jumpPower: number = 13;

    @Tooltip("When this property is enabled, the ZEPETO character can perform a double jump.")
    public enableDoubleJump: bool = false;

    @Tooltip("Set the jump power for the double jump. The default value is 13.")
    public doubleJumpPower: number = 13;

    @Tooltip("Gravity percentage, 1 is default")
    public gravity: number = 1;
    
    @Header("Scene Settings")

    @Tooltip("Set the ground height at which the ZEPETO character will return to the spawn location when falling. Otherwise, the character may fall indefinitely. This value can be set between -100 and -500.")
    public fallAreaPosition: number = -20;

    private zepetoCharacter: ZepetoCharacter = null;

    public OnSceneInitialized: UnityEvent;
    
    @HideInInspector()
    public teleporter: TeleportArea;
    

    /* Singleton */
    private static m_instance: SceneManager = null;
    public static get instance(): SceneManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<SceneManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(SceneManager.name).AddComponent<SceneManager>();
            }
        }
        return this.m_instance;
    }
    private Awake() {
        if (SceneManager.m_instance !== null && SceneManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            SceneManager.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    private Destroy() {
        if (SceneManager.m_instance == this)
            SceneManager.m_instance = null;
    }
    
    
    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

            this.SetTeleportArea();
            this.SetCharacterSettings();
            this.SetDoubleJump();
            
            this.OnSceneInitialized?.Invoke();
        });
        
    }
    
    private SetTeleportArea() {
        const cube = new GameObject;
        const clampPosition = Math.max(-500, Math.min(this.fallAreaPosition, -100));
        cube.transform.position = new Vector3(0, clampPosition, 0);
        const col = cube.AddComponent<BoxCollider>();
        col.isTrigger = true;
        col.size = new Vector3(5000, 50, 5000);
        this.teleporter = cube.AddComponent<TeleportArea>();
        this.teleporter.destination = this.zepetoCharacter.transform.position;
    }

    private SetCharacterSettings(){
        this.zepetoCharacter.additionalJumpPower = this.jumpPower - this.zepetoCharacter.JumpPower;
        this.zepetoCharacter.additionalWalkSpeed = this.walkSpeed - this.zepetoCharacter.WalkSpeed;
        this.zepetoCharacter.additionalRunSpeed = this.runSpeed - this.zepetoCharacter.RunSpeed;
        this.zepetoCharacter.motionState.doubleJumpPower = this.doubleJumpPower;
        this.zepetoCharacter.motionState.gravity *= this.gravity;
    }

    private SetDoubleJump() {

        // if (!this.enableDoubleJump) {
        //     return;
        // }
        

        // Find an object of type ZepetoScreenButton in the scene
        const screenButton = Object.FindObjectOfType<ZepetoScreenButton>();

        // Add a listener for the OnPointDownEvent of the screen button to handle jump actions
        screenButton.OnPointDownEvent.AddListener(() => {

            if (!this.enableDoubleJump) {
                return;
            }
            
            // If the character's current state is Jump, trigger a double jump
            if (this.zepetoCharacter.CurrentState === CharacterState.Jump) {
                this.zepetoCharacter.DoubleJump();
            }
        });
    }
}