import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject } from 'UnityEngine';
// import AE_Character_Gesture from "../../../Scripts/InteractionSystem/Actions/AE_Character_Gesture";
import { DonationEventData } from "../Types";

export default class DN_Wardrobe extends DonationTimedActionBase
{
    // private ae: AE_Character_Gesture;

    @Tooltip("Wardrobe items")
    public items: string[];
    

    Start() {
        super.Start();
        // this.ae = this.GetComponentInChildren<AE_Character_Gesture>();
    }

    DoAction(data: DonationEventData) {

        // this.ae.duration = this.duration;
        super.DoAction();
    }
}
