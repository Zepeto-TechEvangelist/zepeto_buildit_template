import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject } from 'UnityEngine';
import AE_Character_Gesture from "../../../Scripts/InteractionSystem/Actions/AE_Character_Gesture";
import { DonationEventData } from "../Types";
import {AnimationClip} from "UnityEngine";

export default class DN_Gesture extends DonationTimedActionBase
{
    private ae: AE_Character_Gesture;
    
    @Tooltip("Gesture animation")
    public gesture: AnimationClip;
    
    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Character_Gesture>();
    }

    DoAction(data: DonationEventData) {
        this.ae.gesture = this.gesture;
        this.ae.duration = this.duration;
        super.DoAction();
    }
}
