import {
    Object,
    Transform,
    GameObject,
    Quaternion,
    Vector3,
    HumanBodyBones,
    AnimationClip,
    Animator,
    MeshCollider,
    RuntimeAnimatorController,
    AnimatorOverrideController,
    AudioSource, AudioClip
} from 'UnityEngine'
import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {IList$1} from 'System.Collections.Generic';
import VehicleAudio from "./VehicleAudio";

export enum State {
    Idle,
    Move,
    Back,
    MaxSpeed,
    Boost,
    None
}

/**
 * Component that controls the vehicle object state, including animations blending and effects.
 * It provides a configuration for a vehicle object so it is usually attached to the verhicle root.
 */
export default class VehicleStateController extends ZepetoScriptBehaviour {

    @Header("Animations")
    public clipMove: AnimationClip;
    public clipLeft: AnimationClip;
    public clipRight: AnimationClip;

    @Header("Audio")
    public audioSource: AudioSource;
    private _vehicleAudio: VehicleAudio;
    
    @Header("Functional Anchor Points")
    /// The driver anchor point
    public driver: Transform;
    /// List of passenger anchor points
    public passenger: Transform[];
    /// List of possible exit anchor points
    public exitPoints: Transform[];
    /// First person camera anchor
    public cameraFPS: Transform;     // first person camera position
    /// Third person camera anchor
    public cameraTPS: Transform;     // third person
    

    @Header("Model")
    public animatorController: RuntimeAnimatorController;
    public body: Transform;
    public animator: Animator;
    public boundCollider: MeshCollider;
    public bound: Transform[];

    @Header("Miscelanious")
    public vehicleId: string;
    public hornAssetKey: string;

    private prevState: State = State.None;
    
    
    protected OnUpdateState(prev: State, next: State) {

        if (next == State.None) {
            // Stop audio
            this._vehicleAudio?.StopSound();
        }
        else if (prev == State.None) {
            this._vehicleAudio?.StartSound();
        }
        
    }

    protected OnInit() {
        // Intentionall left blank
    }

    public GetLandingFxKey(): string {
        return null
    }
    
    Awake() {
        this.cameraFPS ??= this.transform.Find("cameraFPS");
        this.cameraTPS ??= this.transform.Find("cameraTPS") ?? this.transform.Find("camearTPS");
        const positions = this.transform.Find("Positions")
        this.driver ??= positions.Find("Driver")
        this.exitPoints ??= [];
        if (this.exitPoints.length == 0)
            this.exitPoints.push(this.transform.Find("/Exits/Exit_1") ?? this.transform.Find("Exit_1") ) ?? positions.Find("Exit_1")
        this.body ??= this.transform.GetChild(this.transform.childCount - 1);
        this.animator ??= this.body.GetComponentInChildren<Animator>();
        
        this.audioSource = this.gameObject.AddComponent<AudioSource>();
        this.audioSource.playOnAwake = false;
    
        this._vehicleAudio = this.GetComponent<VehicleAudio>() ?? this.GetComponentInChildren<VehicleAudio>(true);
    }
    
    private Start() {
        this.BindAnimator();
        this.SetupCameras();
    }
    
    public SetupCameras() {
        
        // Static position binding for camera
        this.cameraTPS.localPosition = Vector3.op_Addition(this.cameraTPS.localPosition, new Vector3(0, 1.3, -4));
        
        
        // if (true /*this.cameraTPS.localPosition.x == 0 && this.cameraTPS.localPosition.y == 0 && this.cameraTPS.localPosition.z == 0*/) {
        //     this.cameraTPS.localPosition.Set(
        //         VehicleStateController.defaultCameraTPSPosition[0], 
        //         VehicleStateController.defaultCameraTPSPosition[1], 
        //         VehicleStateController.defaultCameraTPSPosition[2]);
        // }
        
    }
    
    public BindAnimator() {
        if (this.animator != null && this.clipMove) {
            this.animator.runtimeAnimatorController = Object.Instantiate(this.animatorController) as RuntimeAnimatorController;

            let _animatorController: AnimatorOverrideController = this.animator.runtimeAnimatorController as AnimatorOverrideController;

            let SetAnimationClip = (key: string, clip: AnimationClip) => {
                // _animatorController[key] = clip != null ? clip : this.clipMove;
                _animatorController.set_Item(key, clip);
            };

            SetAnimationClip("Vehicle_Move", this.clipMove);
            SetAnimationClip("Vehicle_Left", this.clipLeft ?? this.clipMove);
            SetAnimationClip("Vehicle_Right", this.clipRight ?? this.clipMove);
        }
    }
    

    private OnDestroy() {
        if (this.animator != null) {
            this.animator.runtimeAnimatorController = null;
        }
    }


    public Init(vehicleId: string, hornAssetKey: string) {
        // passenger.ForEach((p, index) => {
        //     p.VehicleId = vehicleId;
        //     p.Seat = (index + 1).ToString();
        //     });

        this.vehicleId = vehicleId;
        this.hornAssetKey = hornAssetKey;

        this.UpdateState(State.None);
        this.UpdateBlend(0);
        this.UpdateSpeed(0);

        this.OnInit();
    }
    
    public Reset() {

        this.UpdateState(State.None);
        this.UpdateBlend(0);
        this.UpdateSpeed(0);
        this._vehicleAudio?.StopSound();
    }


    public GetArea(seat: int): Transform {
        if (seat > 0 && this.passenger.length >= seat) {
            return this.passenger[seat - 1];
        }
        return null;
    }

    public UpdateState(state: State) {

        if (this.prevState == state) return;

        this.OnUpdateState(this.prevState, state);
        
        this.prevState = state;
    }

    public UpdateBlend(blend: float) {
        if (this.animator != null)
            this.animator.SetFloat("Blend", blend);
    }

    public UpdateSpeed(speed: float) {
        if (this.animator != null)
            this.animator.SetFloat("Speed", speed);
        
        this._vehicleAudio.SpeedUpdate(speed);
    }

}

class Setter {
    public target: GameObject;
    // {
    //     get; private set;
    // }
    public duration: float
    // {
    //     get; private set;
    // }
    private _isOn: boolean = true;

    public get IsOn(): boolean {
        return this._isOn
    }

    public set IsOn(value: boolean) {
        this.target?.SetActive(value);
        this._isOn = value;
    }

    public Setter(key: string, parent: Transform) {
    }

    public Dispose() {
        if (this.target != null) {
            // CommonObjectPool.instance.ReturnObject(target);
            this.target = null;
        }
    }

}