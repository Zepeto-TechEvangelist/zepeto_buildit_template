import {HumanBodyBones, AnimationClip, Texture} from 'UnityEngine'
import {ZepetoScriptableObject} from 'ZEPETO.Script'

export enum VehicleCategory {
    Ground,
    Fly,
    Water
}

export default class VehicleObjectSettings {
    public icon: string;
    public assetKey: string;
    public hornAssetKey: string;

    public category: VehicleCategory;

    @Header("Attach")
    public attaches: string[];

    @Header("Input")
    public isInputRotate: bool = true;

    @Header("Bone")
    @Tooltip("Default is LastBone")
    public targetBone: HumanBodyBones = HumanBodyBones.LastBone;
    
    public characterHeight: float = 1;

    @Header("Animations - Zepeto")
    public idle_left_zepeto: AnimationClip;
    public idle_right_zepeto: AnimationClip;
    public idle_zepeto: AnimationClip;
    public run_left_zepeto: AnimationClip;
    public run_right_zepeto: AnimationClip;
    public run_zepeto: AnimationClip;
    public horn_zepeto: AnimationClip;
    public jump_zepeto: AnimationClip;
    public passenger_zepeto: AnimationClip;
    public land_zepeto: AnimationClip;
    public fall_zepeto: AnimationClip;
    public action_zepeto: AnimationClip;

    
    
    @Header("Handle Sprite")
    public handle: Texture;

    @Header("Local Name")
    public localKey: string;

    @Header("Speed")
    @Tooltip("Rate of angular movement sensitivity")
    public rotateAnglePerFrame: float = 2
    ;
    @Tooltip("Rate of speed acceleration for forward movement")
    public accSpeedPerFrame: float = .07
    ;
    @Tooltip("Rate of speed deceleration")
    public decreaseSpeedPerFrame: float = .01
    ;
    @Tooltip("Global speed modifier")
    public magnification: float = 1.5
    ;
    @Tooltip("Modifier applied for backwards movement (negative value)")
    public backMagnification: float = -.5
    ;

    @Header("Boost")

    @Tooltip("Speed multiplier for boost")
    public boostMagnification: float = 1.5;

    @Tooltip("Duration of the speed boost in seconds")
    public boostDuration: float = 1;

    @Header("Apply")
    
    public isSlope: bool = false;


    @Header("Option")
    @Tooltip("Horn option enabled")
    public isHorn: bool = false;
    @Tooltip("Headlight option enabled")
    public isHeadlight: bool = false;
    @Tooltip("Jump option enabled")
    public isJump: bool = false;
    @Tooltip("Boost option enabled")
    public isBoost: bool = false;
    @Tooltip("Action option enabled")
    public isAction: bool = false;
}