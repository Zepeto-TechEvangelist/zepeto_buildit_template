import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import MotionModifier, {ModifierType} from '../../../Modules/Scripts/MotionModifier';
import MotionModifierZone from '../../../Modules/Scripts/MotionModifierZone';

export default class BuffPlatform extends ZepetoScriptBehaviour
{
    public walkSpeed: float;
    public runSpeed: float;
    public jumpPower: float;
    
    private _zone: MotionModifierZone;
    
    Awake() {
        this._zone = this.GetComponentInChildren<MotionModifierZone>();
        this._zone.walkSpeed = this.walkSpeed;
        this._zone.modifyWalk = ModifierType.Additive;
        this._zone.runSpeed = this.runSpeed;
        this._zone.modifyRun = ModifierType.Additive;
        this._zone.jumpPower = this.jumpPower;
        this._zone.modifyJump = ModifierType.Additive;
        this._zone.gravity = 0;
        this._zone.modifyGravity = ModifierType.Additive;
    }


}