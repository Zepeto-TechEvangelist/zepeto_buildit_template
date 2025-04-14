import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

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


    /** ----------------------------------------------------------------------------------------------------------- */
    
    // Current active modifier applied
    protected static ActiveModifier: MotionModifier;
    
    // Tag designating modifiers have been applied
    private _modifiersApplied: boolean = false;

    /// Saved jump power modifier
    private _jumpPower: float;

    /// Saved run speed modifier
    private _runSpeed: float;

    /// Saved walk speed modifier
    private _walkSpeed: float;

    /// Saved gravity modifier
    private _gravity: float;

    /** ----------------------------------------------------------------------------------------------------------- */


    /** ----------------------------------------------------------------------------------------------------------- */
    // Main code

    public SaveState(character: ZepetoCharacter) {
        if (this._modifiersApplied)
            return;

        this._jumpPower = character.additionalJumpPower;
        this._runSpeed = character.additionalRunSpeed;
        this._runSpeed = character.additionalWalkSpeed;
        this._gravity = character.motionState.gravity;
    }

    public RestoreState(character: ZepetoCharacter) {
        if (false == this._modifiersApplied)
            return;

        character.additionalJumpPower = this._jumpPower;
        character.additionalRunSpeed = this._runSpeed;
        character.additionalWalkSpeed = this._runSpeed;
        character.motionState.gravity = this._gravity;

        MotionModifier.ActiveModifier = null;
        this._modifiersApplied = false;
    }

    public ApplyModifier(baseValue: float, modifier: float, modifierType: ModifierType): float {

        var value = baseValue;

        switch (modifierType) {
            case ModifierType.Additive:
                value += modifier;
                break;
            case ModifierType.Flat:
                value = modifier;
                break;
            case ModifierType.Multiplicative:
                value *= modifier;
                break;
        }

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
        
        // Lock updates
        MotionModifier.ActiveModifier = this;
        this._modifiersApplied = true;
    }
    
    /** ----------------------------------------------------------------------------------------------------------- */

}