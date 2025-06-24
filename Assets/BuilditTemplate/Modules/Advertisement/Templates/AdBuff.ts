import { AdvertisementActionBase } from "./AdvertisementActionBase";
import AE_Character_Buff from "../../Scripts/InteractionSystem/Actions/AE_Character_Buff";
import MotionModifier from "../../Scripts/MotionModifier";

export default class AdBuff extends AdvertisementActionBase
{
    public moveSpeedMultiplier : number;
    public jumpPowerMultiplier : number;
    @HideInInspector()
    public enableDoubleJump : boolean;
    public buffDurationSeconds : number;
    
    
    Start() {
        super.Start();
        
        let ae = this.GetComponentInChildren<AE_Character_Buff>();
        ae.Init();
        
        let modifier = ae.motionModifier;
        
        modifier.jumpPower = this.jumpPowerMultiplier;
        modifier.runSpeed = this.moveSpeedMultiplier;
        modifier.walkSpeed = this.moveSpeedMultiplier;
        // modifier.enableDoubleJump = this.enableDoubleJump;
        modifier.modifierDuration = this.buffDurationSeconds;
    }
}
