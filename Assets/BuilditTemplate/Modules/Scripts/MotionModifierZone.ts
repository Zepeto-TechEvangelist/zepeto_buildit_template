import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType } from './PlayerTrigger';
import MotionModifier, {ModifierType} from './MotionModifier';

export default class MotionModifierZone extends MotionModifier implements PlayerTriggerInterface
{
    
    @HideInInspector() public override gravity: float;
    @HideInInspector() public override modifyGravity: ModifierType = ModifierType.Multiplicative;
    
    /** ------------------------------------------------------------------------ */
    // Behaviour events
    
    private _playerTrigger: PlayerTrigger;
    
    Start() {
        this._playerTrigger = this.GetComponentInChildren<PlayerTrigger>();
        this._playerTrigger.delegate = this;
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