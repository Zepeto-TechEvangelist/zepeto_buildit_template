import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType } from './PlayerTrigger';
import MotionModifier, {ModifierType} from './MotionModifier';

export default class MotionModifierZone extends MotionModifier implements PlayerTriggerInterface
{
    
    private _trigger: PlayerTrigger;
    public get trigger(): PlayerTrigger { return this._trigger; }
    
    /** ------------------------------------------------------------------------ */
    // Behaviour events
    
    Start() {
        this._trigger = this.GetComponentInChildren<PlayerTrigger>();
        this._trigger.delegate = this;
    }
    
    /** ------------------------------------------------------------------------ */
    // Player trigger delegate

    OnPlayerEnter(character: ZepetoCharacter, type: ZepetoCharacterType) {
        this.ApplyModifiers(character);
    }
    OnPlayerStay(character: ZepetoCharacter, type: ZepetoCharacterType) {
        // Intentionally left empty
    }
    OnPlayerExit(character: ZepetoCharacter, type: ZepetoCharacterType) {
        this.RestoreState(character);
    }
    
}