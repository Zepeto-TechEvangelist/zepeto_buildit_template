import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import SceneManager from "../Scripts/SceneManager";
import { Coroutine, WaitForSeconds } from "UnityEngine";

export enum ModifierType {
    /** Add the modifier to current value */
    Additive,
    /** Set a new flat value ignoring current value */
    Flat,
    /** Multiply the current value */
    Multiplicative
}

export default class MotionModifier extends ZepetoScriptBehaviour
{
    
    @Tooltip("The type of modification applied to jump power")
    public modifyJump: ModifierType = ModifierType.Multiplicative;
    @Tooltip("The value of modification to ")
    public jumpPower: float = 2;

    @Tooltip("The type of modification applied to run speed")
    public modifyRun: ModifierType = ModifierType.Multiplicative;
    @Tooltip("The value of modification to run speed")
    public runSpeed: float = 2;

    @Tooltip("The type of modification applied to walk speed")
    public modifyWalk: ModifierType = ModifierType.Multiplicative;
    @Tooltip("The value of modification to walk speed")
    public walkSpeed: float = 2;

    @Tooltip("The type of modification applied to gravity")
    public modifyGravity: ModifierType = ModifierType.Multiplicative;
    @Tooltip("The value of modification to gravity")
    public gravity: float = 0.5;
    
    @Tooltip("Enable double jump")
    @HideInInspector() public enableDoubleJump: boolean = false;
    
    @Tooltip("Duration of applied modifiers, negative values for infinite duration")
    public modifierDuration: number = -1;

    /** ----------------------------------------------------------------------------------------------------------- */
    
    // Current active modifier applied
    protected static ActiveModifier: MotionModifier;
    
    // Tag designating modifiers have been applied
    private _modifiersApplied: boolean = false;

    /// Saved jump power modifier
    private _jumpPower: float;
    
    /// Saved double jump modifier
    private _doubleJumpPower: float;

    /// Saved run speed modifier
    private _runSpeed: float;

    /// Saved walk speed modifier
    private _walkSpeed: float;

    /// Saved gravity modifier
    private _gravity: float;
    
    /// Saved double jump modifier
    private _enableDoubleJump: boolean;

    /** ----------------------------------------------------------------------------------------------------------- */


    /** ----------------------------------------------------------------------------------------------------------- */
    // Main code

    public SaveState(character: ZepetoCharacter) {
        if (this._modifiersApplied)
            return;

        this._jumpPower = character.additionalJumpPower;
        this._runSpeed = character.additionalRunSpeed;
        this._walkSpeed = character.additionalWalkSpeed;
        this._gravity = character.motionState.gravity;
        // this._doubleJumpPower = character.motionState.doubleJumpPower;
        // this._enableDoubleJump = SceneManager.instance.enableDoubleJump;
    }

    public RestoreState(character: ZepetoCharacter) {
        if (false == this._modifiersApplied)
            return;

        character.additionalJumpPower = this._jumpPower;
        character.additionalRunSpeed = this._runSpeed;
        character.additionalWalkSpeed = this._walkSpeed;
        character.motionState.gravity = this._gravity;
        // character.motionState.doubleJumpPower = this._doubleJumpPower;
        // SceneManager.instance.enableDoubleJump = this._enableDoubleJump;
        
        MotionModifier.ActiveModifier = null;
        this._modifiersApplied = false;
    }

    public ApplyModifier(baseValue: float, modifier: float, modifierType: ModifierType): float {
        
        let value = baseValue;

        if (modifierType == ModifierType.Additive)
            value += modifier;
        else if (modifierType == ModifierType.Flat)
            value = modifier;
        else if (modifierType == ModifierType.Multiplicative)
            value *= modifier;
        
        return value - baseValue;
    }

    public ApplyModifiers(character: ZepetoCharacter) {
        
        if (this._modifiersApplied)
            return;
        
        MotionModifier.ActiveModifier?.RestoreState(character);
        this.SaveState(character);

        // Jump
        character.additionalJumpPower = this.ApplyModifier(character.JumpPower, this.jumpPower,  this.modifyJump);

        // Walk
        character.additionalWalkSpeed = this.ApplyModifier(character.WalkSpeed, this.walkSpeed,  this.modifyWalk);

        // Run
        character.additionalRunSpeed = this.ApplyModifier(character.RunSpeed, this.runSpeed,  this.modifyRun);

        // Gravity
        character.motionState.gravity += this.ApplyModifier(character.motionState.gravity, this.gravity, this.modifyGravity);

        // Double jump
        // character.motionState.doubleJumpPower = this.ApplyModifier(character.motionState.doubleJumpPower, this.jumpPower, this.modifyJump);
        // character.motionState.useDoubleJump = this.enableDoubleJump;
        // SceneManager.instance.enableDoubleJump = this.enableDoubleJump;
        
        
        // Lock updates
        MotionModifier.ActiveModifier = this;
        this._modifiersApplied = true;

        if (this.modifierDuration > 0) {
            this.StartCoroutine(this.WaitRestoreState(character, this.modifierDuration));
        }

    }
    
    /** ----------------------------------------------------------------------------------------------------------- */

    private *WaitRestoreState(character: ZepetoCharacter, duration: number) {
        yield new WaitForSeconds(duration);
        this.RestoreState(character);
    }
}