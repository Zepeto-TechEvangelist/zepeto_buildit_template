import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject } from 'UnityEngine';
import AE_Character_Buff from "../../../Scripts/InteractionSystem/Actions/AE_Character_Buff";
import { DonationEventData } from "../Types";


export default class DN_Buff extends DonationTimedActionBase
{
    private ae: AE_Character_Buff;

    @Tooltip("Movement speed multiplier factor, values between 0 and 1 will reduce the speed while >1 will increase the speed")
    public moveSpeedMultiplier : number;
    
    @Tooltip("Jump power multiplier factor, values between 0 and 1 will reduce the power while >1 will increase the power")
    public jumpPowerMultiplier : number;
    
    
    Start() {
        super.Start();
        
        this.ae = this.GetComponentInChildren<AE_Character_Buff>();
        this.ae.Init();
    }

    DoAction(data: DonationEventData) {
        
        const modifier = this.ae.motionModifier;

        modifier.jumpPower = this.jumpPowerMultiplier;
        modifier.runSpeed = this.moveSpeedMultiplier;
        modifier.walkSpeed = this.moveSpeedMultiplier;
        modifier.modifierDuration = this.duration;
        
        super.DoAction();
    }
}
