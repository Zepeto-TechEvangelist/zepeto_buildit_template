import {Object, Quaternion, Vector3, HumanBodyBones, Vector2, Camera, Transform, Rigidbody, Time, Coroutine, CharacterController, WaitForSeconds} from 'UnityEngine'
import {ZepetoScriptBehaviour, ZepetoScriptableObject} from 'ZEPETO.Script'
import VehicleStateController, {State} from "./VehicleStateController";
import VehicleObjectSettings from "./VehicleObjectSettings";
import { ZepetoPlayers, ZepetoPlayer, LocalPlayer, ZepetoScreenTouchpad, ZepetoPlayerControl, ZepetoScreenButton } from "ZEPETO.Character.Controller";
import VehicleUIController from "./VehicleUIController";
import SceneManager from "../../Scripts/SceneManager";
import KeyboardControl from "./KeyboardControl";
import { ApplicationUtilities } from "../../Scripts/Utility/ApplicationUtilities";

/**
 * Component that replaces ZepetoCharacterController when driving a Vehicle object.
 * It controls the movement by linking the momevent input to vehicle configuration and controller.
 */
export default class VehicleMovementController extends ZepetoScriptBehaviour {
    
    // Attach events
    public getOutButton: ZepetoScreenButton;
    
    // Blend as local rotation of wheels
    public currentVehicleBlendValue: float;
    
    protected tpCamera: Camera;
    
    protected currAngle: float;
    protected currVelocity: Vector3;
    protected currRotation: Vector3;
    
    public vehicle: Transform;
    
    @HideInInspector() public vehicleSettings: VehicleObjectSettings;

    protected vehicleStateController: VehicleStateController;

    private characterController: CharacterController;
    private controller: ZepetoPlayerControl;
    
    // Obsolete
    // protected rigidbody: Rigidbody;

    // Required properties from the default character movement controller
    protected speedPercent: float = 0;
    protected boostValue: float = 1;
    
    // TODO: rename value or follow with attach controller
    private isAttached: boolean = false;  
    private localPlayer: LocalPlayer;
    
    public get isAvailableBoost(): boolean {
        return this.boostValue <= 1
    }

    // Input
    protected m_isMoving: boolean = false;
    protected m_moveDir: Vector2 = Vector2.zero;

    /** --------------------------------------------------------------------------------------------------------- */
    
    protected SetInitialState() {
        this.speedPercent = 0;
        this.boostValue = 1;
        this.currentVehicleBlendValue = 0;

        
        this.UpdateVehicleBlend(Vector3.zero, 0, false);
        this.UpdateState(State.None);
    }

    public OnCreateVehicle() {
        this.UpdateState(State.Idle);
        this.SetInitialState();
    }

    public OnEndVehicle() {
        this.UpdateState(State.None);
        this.EndBoost();
        
        if (this.c_boost)
            this.StopCoroutine(this.c_boost);
        
        this.SetInitialState();
    }

    /** --------------------------------------------------------------------------------------------------------- */
    // Interface UIPlayerController

    public AttachTouchpad() {
        if (this.isAttached) return;
        
        // Touchpad
        let touchpad = this.GetComponentInChildren<ZepetoScreenTouchpad>();

        touchpad.OnPointerDownEvent.AddListener(() => { this.StartMoving() });
        touchpad.OnDragEvent.AddListener(delta => { this.Move(delta) });
        touchpad.OnPointerUpEvent.AddListener(() => { this.StopMoving() });
        
        
        // PC Keyboard attach
        if (ApplicationUtilities.isMobile == false) {
            const keyboard = this.gameObject.GetComponent<KeyboardControl>() ?? this.gameObject.AddComponent<KeyboardControl>();
            keyboard.Init();

            keyboard.OnStartMoving.AddListener(() => {
                this.StartMoving()
            });
            keyboard.OnMove.AddListener(delta => {
                this.Move(delta)
            });
            keyboard.OnStopMoving.AddListener(() => {
                this.StopMoving()
            });
        }
        
        this.isAttached = true;
    }
    
    public DetachTouchpad() {
        if (!this.isAttached) return;

        let touchpad = this.GetComponentInChildren<ZepetoScreenTouchpad>();
        touchpad.OnPointerDownEvent.RemoveAllListeners();
        touchpad.OnDragEvent.RemoveAllListeners();
        touchpad.OnPointerUpEvent.RemoveAllListeners();
        
        const keyboard = this.GetComponent<KeyboardControl>();
        if (keyboard !== null) {
            keyboard?.Release();
            Object.Destroy(keyboard);
        }
        
        this.isAttached = false;
    }
    
    public GetIn(vehicle: Transform, stateController: VehicleStateController) {
        this.vehicle = vehicle;
        this.vehicleStateController = stateController;
        this.localPlayer = ZepetoPlayers.instance.LocalPlayer;
        this.tpCamera = this.localPlayer.zepetoCamera.camera;
        
        this.characterController = this.localPlayer.zepetoPlayer.character.characterController;

        this.AttachTouchpad();
        this.OnCreateVehicle();
    }

    public GetOut() {
        this.enabled = false;   // disable updates
        this.DetachTouchpad();
        this.getOutButton.OnPointDownEvent.RemoveAllListeners();

        this.OnEndVehicle();

        this.localPlayer.zepetoPlayer.character.constraintRotation = false;
        
        this.vehicle = null;
        this.vehicleStateController = null;
        this.tpCamera = null;
        this.localPlayer = null;
    }


    /** --------------------------------------------------------------------------------------------------------- */
    // Input binding
    
    public StartMoving() {
        this.m_isMoving = true;
    }

    public Move(delta: Vector2) {
        this.m_moveDir = delta;
    }

    public StopMoving() {
        this.m_isMoving = false;
        this.m_moveDir = Vector2.zero;
    }

    /** --------------------------------------------------------------------------------------------------------- */
    
    LateUpdate() {
        if (!this.isAttached) 
            return;
        
        this.VehicleMovement();
    }
    
    protected UpdateRotation(rotation: Vector3) {
        // this.vehicle.eulerAngles = rotation;
        this.currRotation = rotation;
    }

    protected ControlSpeed(velocity: Vector3) {
        
    }
    
    protected UpdateTargetDirection(rotation: Transform) {
        
        const camera = this.localPlayer.zepetoCamera.camera.transform;
        const tps = this.vehicleStateController.cameraTPS.position;
        // Note: Lerp value has cool effect
        camera.position = Vector3.Lerp(camera.position, tps, 0.3); //0.4
        camera.LookAt(this.vehicle.position);
    }

    protected UpdateState(state: State) {
        this.vehicleStateController.UpdateState(state);
    }

    protected UpdateVehicleState(previousVelocity: Vector3, currentVelocity: Vector3): State {

        let speed = currentVelocity.magnitude;
        
        if (speed == 0) {
            this.localPlayer.StopMoving();
            return State.Idle;
        }
        else {
            this.localPlayer.zepetoPlayer.character.constraintRotation = true;
            this.localPlayer.zepetoPlayer.character.transform.rotation = Quaternion.Euler(this.currRotation);
            this.localPlayer.Move(currentVelocity);

            
            if (this.speedPercent > 1)
                return State.Boost;
            else if (this.m_moveDir.y < -0.2)
                return State.Back;
            else if (this.speedPercent == 1 ? true : false)
                return State.MaxSpeed;
         
            return State.Move;
        }
    }

    protected UpdateVehicleBlend(velocity: Vector3, rotate: float, isAcc: boolean) {
        // TODO: Blend point between -1 and 1
        this.vehicleStateController.UpdateBlend(rotate);
        this.vehicleStateController.UpdateSpeed(this.speedPercent);
    }

    protected UpdateSlope() {
    }

    // --------------------------------------------------------------------------------------------------------- 

    /**
     *  Movement calculations function
     */
    private VehicleMovement() {

        let input: Vector2 = this.m_moveDir;
        
        let prevVelocity = this.currVelocity;
        let speed: float = 0;
        let angle: float = 0;
        let rotate: float = 0;
        let velocity: Vector3 = Vector3.zero;

        // TODO: Get the settings per vehicle
        
        const settings = this.vehicleSettings;
        
        let isInputRotate: boolean = settings.isInputRotate;
        let accSpeedPerFrame: float = settings.accSpeedPerFrame;
        let decreaseSpeedPerFrame: float = settings.decreaseSpeedPerFrame;
        let backMagnification: float = settings.backMagnification;
        let rotateAnglePerFrame: float = settings.rotateAnglePerFrame;
        let magnification: float = settings.magnification;
        let acceleration: float = 1.0;
        
        let vehicleStateController: VehicleStateController = this.vehicleStateController;
        
        if (true) {
            
            // Low pass filter (-0.2; 0.2)
            var increase = (input.y > .2) ? 1 : (input.y < -0.2 ? -1 : 0);

            if (increase != 0) {
                this.speedPercent += accSpeedPerFrame * increase;
            } else 
            {
                // Inertion force for slowing down without forward input force
                if (this.speedPercent >= decreaseSpeedPerFrame)
                    this.speedPercent -= decreaseSpeedPerFrame;
                else if (this.speedPercent <= -decreaseSpeedPerFrame)
                    this.speedPercent += decreaseSpeedPerFrame;

                if (Math.abs(this.speedPercent) < decreaseSpeedPerFrame)
                    this.speedPercent = 0;
            }

            this.speedPercent = Math.min(Math.max(this.speedPercent, backMagnification), 1.0);

            // this.UpdateTargetDirection(this.tpCamera.transform);
            
            const sp = Math.abs(this.speedPercent);
            rotate = sp > .5 ? 1 :
                sp > .25 ? .5 :
                    sp > .10 ? .2 :
                        sp > .01 ? .05 : 0;
            
            const aix = Math.abs(input.x);
            const ix_modifier =  aix > .5 ? 1 :
                                    aix > .3 ? .5 :
                                        aix > .15 ? .25 : 0;
            
            rotate *= rotateAnglePerFrame * ix_modifier * (input.x > 0 ? 1 : -1);
            
            angle = this.vehicle.eulerAngles.y + rotate * (this.speedPercent > 0 ? 1 : -1);
            velocity = Vector3.op_Multiply( 
                Quaternion.Euler(this.vehicle.eulerAngles.x, angle, this.vehicle.eulerAngles.z) * Vector3.forward, 
                ( acceleration * this.speedPercent * magnification ) );
        }

        this.ControlSpeed(velocity);
        this.UpdateRotation(new Vector3(this.vehicle.eulerAngles.x, angle, this.vehicle.eulerAngles.z));

        if (vehicleStateController == null) return;

        this.UpdateSlope();

        this.currAngle = angle;
        this.currVelocity = this.characterController.velocity;// velocity;//this.rigidbody.velocity;

        // Note: Not required because of rotation lock
        // velocity = new Vector3(this.currVelocity.x, 0, this.currVelocity.z);

        var isAcc = Vector3.Dot(this.vehicle.forward, prevVelocity) <= Vector3.Dot(this.vehicle.forward, velocity) + decreaseSpeedPerFrame * .5;
        // container.UpdateForward(Vector3.Angle(this.vehicle.forward, velocity));  // Not required?
        this.UpdateVehicleBlend(velocity, rotate, isAcc);
        //
        //     // Water etc
        //     ControlEnvironmentSpeed(ENVIRONMENT_FORCE);

        // 
        // this.UpdateState(velocity /*/ ScaleSpeedModifier*/, JumpState);
        //
        var nextState = this.UpdateVehicleState(prevVelocity, velocity);
        vehicleStateController.UpdateState(nextState);
        
        this.UpdateTargetDirection(this.tpCamera.transform);

        
        // if (!isInputRotate || nextState == State.Idle || nextState == State.None) {
        //     // player.vehicleCameraController.enabled = false;
        //     //  .cameraController.SetSmoothCameraRotation(12);
        // } else {
        //     // player.vehicleCameraController.enabled = true;
        //     // // player.cameraController.SetSmoothCameraRotation(9999);
        // }
    }


    public TryVehicleBoost()
    {
        if (this.isAvailableBoost == false) return;
        
        this.c_boost = this.StartCoroutine(this.Boost());
    }
    
    
    private s_run: float;
    private s_walk: float;
    private c_boost: Coroutine;
    
    private * Boost() {
        var duration = Math.max(this.vehicleSettings.boostDuration, .5);
        this.boostValue = this.vehicleSettings.boostMagnification;
        
        // this.localPlayer.
        let character = this.localPlayer.zepetoPlayer.character;
        this.s_run = character.additionalRunSpeed;
        this.s_walk = character.additionalWalkSpeed;
        
        character.additionalRunSpeed = character.RunSpeed * this.boostValue - character.additionalRunSpeed;
        character.additionalWalkSpeed = character.additionalRunSpeed;
        
        yield new WaitForSeconds(duration);
        
        this.EndBoost();

        yield new WaitForSeconds(5.0);  // 5 second cooldown for boost
        
        this.boostValue = 1;
    }

    private EndBoost() {
        let character = this.localPlayer.zepetoPlayer.character;
        
        // Hard reset as to not interract with other components
        character.additionalWalkSpeed = this.s_walk;
        character.additionalRunSpeed = this.s_run;
    }
    
}