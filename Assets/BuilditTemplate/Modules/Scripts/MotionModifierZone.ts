import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType } from './PlayerTrigger';
import MotionModifier, {ModifierType} from './MotionModifier';

export default class MotionModifierZone extends MotionModifier implements PlayerTriggerInterface
{
    
    /** ------------------------------------------------------------------------ */
    // Behaviour events
    
    
    Start() {
        this.GetComponentInChildren<PlayerTrigger>().delegate = this;
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