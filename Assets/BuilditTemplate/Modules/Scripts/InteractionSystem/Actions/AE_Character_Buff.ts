import { ActionBase } from "../ActionBase";
import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import MotionModifier from "../../MotionModifier";

export default class AE_Character_Buff extends ActionBase {
    
    public target?: ZepetoCharacter;
    @HideInInspector() public motionModifier?: MotionModifier;


    Init() {
        this.motionModifier ??= this.GetComponent<MotionModifier>();
    }
    
    override DoAction(): void {
        this.target ??= ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        this.motionModifier?.ApplyModifiers(this.target);
    }
}
