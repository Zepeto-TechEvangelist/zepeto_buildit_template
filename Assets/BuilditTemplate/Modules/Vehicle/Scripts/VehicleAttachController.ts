import {
    Transform,
    Animator,
    GameObject,
    HumanBodyBones,
    Object,
    Quaternion,
    Vector3,
    WaitForSeconds,
    Resources, AudioSource, AudioClip
} from 'UnityEngine';
import {ZepetoScriptableObject, ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {UIZepetoPlayerControl, ZepetoCameraControl, ZepetoPlayerControl, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers} from "ZEPETO.Character.Controller";
import {Button} from 'UnityEngine.UI';
import VehicleObjectSettings from './VehicleObjectSettings';
import VehicleStateController from './VehicleStateController';
import VehicleMovementController from "./VehicleMovementController";
import VehicleUIController from "./VehicleUIController";
import UIManager from "../../Scripts/UIManager";

// UI control
import InteractionIcon from "../../Interaction/ZepetoScript/InteractionIcon";
import InteractionIconController from "../../Scripts/InteractionSystem/Controllers/InteractionIconController";
import AdvertisementController from "../../Advertisement/AdvertisementController";

import { VehicleObject, VehicleAction } from "./Types";
import VehicleManager from "./VehicleManager";


/**
 * Component responsible for attaching the vehicle object to a character.
 * It provides a communication layer between.
 * The basic interface functions are GetIn and GetOut.
 */
export default class VehicleAttachController extends ZepetoScriptBehaviour {

    /**
     * Settings for the Vehicle object describing points of interest, animation and movement configuration 
     */
    public vehicleSettings: ZepetoScriptableObject<VehicleObjectSettings>;
    
    /**
     * Settings for attaching the object
     */
    // @HideInInspector()
    // public attachSettings: ZepetoScriptableObject<VehicleAttachObjectSettings>;

    /**
     * Is the vehicle attached to a character
     */
    public isAttached: bool;

    public destroyOnLeave: bool = false;
    
    /**
     * The vehicle object
     */
    public vehicleObj: GameObject;
    
    // UI
    private _getInButton: InteractionIconController;
    private _getOutButton: Button;
    
    // Character
    @HideInInspector() public characters: ZepetoCharacter[] = [];
    private _localCharacter: ZepetoCharacter;
    private _playerSittingPosition: Vector3;
    private _animator: Animator;
    private _characterController: VehicleMovementController;
    private bodyBone: HumanBodyBones = HumanBodyBones.Hips;
    
    // Vehicle
    private _stateController: VehicleStateController;
    
    // Saved State
    private s_characterHeight: float;
    private s_vehicleParent: Transform;
    
    Awake() {
        this.characters ??= [];
        this.vehicleObj ??= this.transform.parent.gameObject;
        this._stateController ??= this.vehicleObj.GetComponent<VehicleStateController>();
        this._getInButton ??= this.GetComponentInChildren<InteractionIconController>(true);
    }
    
    Start() {
        
        if (ZepetoPlayers.instance.LocalPlayer) {
            this.LateInit();
        }
        else {
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                this.LateInit();
            });
        }
        
        this.AttachVehicleStateController();
    }

    private Destroy() {
        VehicleManager.instance.UnregisterController(this);
    }
    
    private LateInit() {
        this._localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        this._characterController = Object.FindObjectOfType<VehicleMovementController>(true);
    
        if (this.syncObj === null) {
           this.syncObj = VehicleManager.instance.CreateSyncObject(this);
        }
    }
    
    public GetIn() {
        if (!this.characters)
            this.characters = [];
        
        if ( VehicleManager.instance.isLocalPlayerDriving || this.isAttached ) 
            return;
        
        const player = ZepetoPlayers.instance.LocalPlayer;
        
        this.GetInPlayer(player.zepetoPlayer);

        VehicleManager.instance.GetInVehicle(this);
    }

    public GetOut() {
        const player = ZepetoPlayers.instance.LocalPlayer;
        VehicleManager.instance.GetOutVehicle(this);
        
        this.GetOutPlayer(player.zepetoPlayer);
        
        if (this.destroyOnLeave) {
            this.DestroyVehicle();
        }
    }
    
    private _VehicleAction(action: VehicleAction) {
        
        VehicleManager.instance.VehicleAction(this, action);
        this.VehicleAction(action);
    }
    
    public VehicleAction(action: VehicleAction) {
        if (action == VehicleAction.Horn) {
            let audioClip = Resources.Load("Vehicle/Audio/" + this.vehicleSettings.targetObject.hornAssetKey) as AudioClip;
            this._stateController.audioSource.PlayOneShot ( audioClip );
        }
        else if (action == VehicleAction.Lights) {
            // To be implemented
        }
    }

    public GetInPlayer(player: ZepetoPlayer, seat: int = 0) {
        if ((player === ZepetoPlayers.instance.LocalPlayer.zepetoPlayer) && 
            VehicleManager.instance.isLocalPlayerDriving)
            return;
        
        this.StartCoroutine(this._GetInPlayer(player, seat));
    }

    private *_GetInPlayer(player: ZepetoPlayer, seat: int = 0) {
        yield new WaitForSeconds(0.1);
        
        this.GetInCharacter(player.character);
    }

    public GetOutPlayer(player: ZepetoPlayer, seat: int = 0) {
        
        this.GetOutCharacter(player.character);
    }
    
    public GetInCharacter(character: ZepetoCharacter, seat: int = 0) {
        if (this.characters[seat] || this.isAttached)
            return;
        
        this.characters[seat] = character;
        
        this._GetIn();
    }
    
    public GetOutCharacter(character: ZepetoCharacter, seat: int = 0) {
        if (!this.characters[seat])
            return;

        this._GetOut();
        
        this.characters[seat] = null;
    }
    
    // public GetInPassenger(character: ZepetoCharacter, seat: int = 0) {
    //
    //     // const player = ZepetoPlayers.instance.LocalPlayer;
    //     // const character = player.zepetoPlayer.character;
    //     // const camera = character player.zepetoCamera;
    //     let vehicleSettings: VehicleObjectSettings = this.vehicleSettings.targetObject;
    //     const passenger: Transform = this._stateController.passenger[seat];
    //    
    //     // 1. Character
    //     this.s_characterHeight = character.characterController.height;
    //     character.characterController.height = vehicleSettings.characterHeight;
    //
    //     // Switch character movement controllers
    //     let defaultController = Object.FindObjectOfType<UIZepetoPlayerControl>();
    //     defaultController.enabled = false;
    //    
    //    
    //     character.Teleport(passenger.position, passenger.rotation);
    //
    //     character.transform.position = passenger.position;
    //     character.transform.rotation = passenger.rotation;
    //     character.StateMachine.constraintStateAnimation = true;
    //
    //     // camera.LockXAxis = true;
    //     // camera.cameraParent.rotation = Quaternion.identity;
    //     // camera.enabled = false;
    //
    //     // const cameraControl = Object.FindObjectOfType<ZepetoCameraControl>();
    //     // cameraControl.Enable = false;
    //
    //     // Activate Vehicle Layer
    //     this._animator.SetLayerWeight(1, 1);
    //     this._animator.SetLayerWeight(0, 0);
    //
    //     // this.AttachVehicleMovementController();
    //
    //     VehicleUIController.instance.SetPassengerMode();
    // }
    
    
    private AttachVehicleStateController() {
        
        const settings: VehicleObjectSettings = this.vehicleSettings.targetObject;
        if (settings.run_left_zepeto) this._stateController.clipLeft = settings.run_left_zepeto;
        if (settings.run_right_zepeto) this._stateController.clipRight = settings.run_right_zepeto;
        this._stateController.clipMove = settings.run_zepeto;
        
        this._stateController.BindAnimator();
    }
    
    /**
     *  Perform attach between the movement controller component and the attach component
     */
    private AttachVehicleMovementController(driver: ZepetoCharacter, isMe: boolean) {

        // Change the hierarchy of the vehicle object
        this.s_vehicleParent = this.vehicleObj.transform.parent;
        // this.vehicleObj.transform.parent = this._localCharacter.transform;
        this.vehicleObj.transform.SetParent(driver.transform, true);
        
        if (isMe) {
            // Communication to movement controller
            this._characterController.GetIn(this.vehicleObj.transform, this._stateController);

            // Additional controls
            this._characterController.getOutButton.OnPointDownEvent.AddListener(() => {
                this.GetOut()
            });
        }
    }
    
    private DetachVehicle() {

        // All other reverse operations
        this.vehicleObj.transform.SetParent(this.s_vehicleParent, true);
    }


    private _GetIn() {
        this.isAttached = true;
        this.SetGetInEnabled(false);
        
        // ------------------------------------------------------------------------------------------------- //
        
        const character = this.characters[0];
        const isMe = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character == character;
        
        let vehicleSettings: VehicleObjectSettings = this.vehicleSettings.targetObject;
        
        // Save character height
        if (character.characterController) {
            this.s_characterHeight = character.characterController.height;
            character.characterController.height = vehicleSettings.characterHeight;
        }
        else {
            console.log("Missing character controller");
        }
        // ------------------------------------------------------------------------------------------------- //

        character.Teleport(this._stateController.driver.position, this._stateController.driver.rotation);
        
        const driver = this._stateController.driver;
        character.transform.position = driver.position;
        character.transform.rotation = driver.rotation;
        character.StateMachine.constraintStateAnimation = true;
        
        // Activate Vehicle Layer
        character.ZepetoAnimator.SetLayerWeight(1, 1);
        character.ZepetoAnimator.SetLayerWeight(0, 0);

        this.AttachVehicleMovementController(character, isMe);
        
        // ------------------------------------------------------------------------------------------------- /

        if (isMe) {
            this.SetInteractionEnabled(false);  // Global interaction
            
            const camera = ZepetoPlayers.instance.ZepetoCamera;
            const cameraControl = Object.FindObjectOfType<ZepetoCameraControl>();
            cameraControl.Enable = false;

            camera.LockXAxis = true;
            camera.cameraParent.rotation = Quaternion.identity;
            camera.enabled = false;

            // Switch character movement controllers
            let defaultController = Object.FindObjectOfType<UIZepetoPlayerControl>();
            defaultController.enabled = false;
            this._characterController.vehicleSettings = vehicleSettings;
            this._characterController.enabled = true;

            // Input Handling (disable keyboard)
            const playerControl = Object.FindObjectOfType<ZepetoPlayerControl>();
            playerControl.Enable = false;
            
          
            VehicleUIController.instance.SetDriveMode(vehicleSettings.isBoost, vehicleSettings.isHorn, vehicleSettings.isHeadlight);
            VehicleUIController.instance.hornButton.onClick.AddListener(() => {
                this._VehicleAction(VehicleAction.Horn);
            });
            VehicleUIController.instance.lightsButton.onClick.AddListener(() => {
                this._VehicleAction(VehicleAction.Lights);
            });
            VehicleUIController.instance.boostButton.onClick.AddListener(() => {
                this._characterController.TryVehicleBoost();
            });
        }
    }

    private _GetOut() {
        this.isAttached = false;
        
        const character = this.characters[0];
        const isMe = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character == character;
        
        // Restore original height
        character.characterController.height = this.s_characterHeight;
        
        this.DetachVehicle();
        
        character.Teleport(this._stateController.exitPoints[0].position, this._stateController.exitPoints[0].rotation);
        
        // Activate Default Layer
        character.ZepetoAnimator.SetLayerWeight(0, 1);
        character.ZepetoAnimator.SetLayerWeight(1, 0);
        
        character.StateMachine.constraintStateAnimation = false;


        if (isMe) {
            const camera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera;
            const uiplayerControl = Object.FindObjectOfType<UIZepetoPlayerControl>(true);
            const cameraControl = Object.FindObjectOfType<ZepetoCameraControl>(true);
            const playerControl = Object.FindObjectOfType<ZepetoPlayerControl>(true);
            
            camera.LockXAxis = false;
            camera.enabled = true;

            uiplayerControl.enabled = true;
            cameraControl.Enable = true;
            playerControl.Enable = true;
            
            // Reset camera position
            const cam = camera.camera.transform;
            cam.position = Vector3.zero;
            cam.rotation = Quaternion.identity;

            this._characterController.GetOut();
            
            VehicleUIController.instance.SetCharacterMode();
            this.SetInteractionEnabled(true);

            this._stateController?.Reset();
        }

        this.SetGetInEnabled(true);
    }
    
    
    private SetGetInEnabled(enable: boolean) {
        try {
            if (this._getInButton && this._getInButton.gameObject)
                this._getInButton.gameObject.SetActive(enable);

            if (enable == false) {
                this._getInButton?.HideIcon();
            }
        }
        catch (e) {
            
        }
    }
    
    /**
     * Global interaction enable/disable
     */
    private SetInteractionEnabled(enable: boolean) {
        
        InteractionIcon.interactionEnabled = enable;
        InteractionIconController.interactionEnabled = enable;
        AdvertisementController.interactionEnabled = enable;
        
        UIManager.instance.SetVisible(enable);
        
        if (!enable) {
            InteractionIcon.allInstances?.forEach(x => x.HideIcon());
            InteractionIconController.allInstances?.forEach(x => x.HideIcon());
            AdvertisementController.allInstances?.forEach(x => x.HideIcon());
        }
    }

    /**
     * Destroy the Vehicle
     */
    public DestroyVehicle() {
        const vehicleObject = this.vehicleObj;
        
        VehicleManager.instance.DestroyVehicle(this);

        if (vehicleObject)
            Object.Destroy(vehicleObject);
    }
    
    /** ------------------------------------------------------------------------------------------ */
    
    
    public get id(): string { return this.syncObj.id }
    public get isOwned(): boolean { return this.syncObj && this.syncObj.ownerId == VehicleManager.instance.SessionId };
    
    @HideInInspector() public syncObj: VehicleObject;
    
    
    public SyncState(sync: VehicleObject) {
        
        this.vehicleObj.transform.position = new Vector3(sync.spawnPosition.x, sync.spawnPosition.y, sync.spawnPosition.z);
        this.vehicleObj.transform.rotation = new Quaternion(sync.spawnRotation.x, sync.spawnRotation.y, sync.spawnRotation.z, sync.spawnRotation.w);
        this.vehicleObj.gameObject.name = sync.id;
        this.syncObj = sync;
        
        if (sync.ownerId) {
            // this.GetInPlayer( ZepetoPlayers.instance.GetPlayer(sync.ownerId) );
            const player = ZepetoPlayers.instance.GetPlayer(sync.ownerId);
            
            if (player)
                this.StartCoroutine( this._GetInPlayer(player) );
        }
    }
}