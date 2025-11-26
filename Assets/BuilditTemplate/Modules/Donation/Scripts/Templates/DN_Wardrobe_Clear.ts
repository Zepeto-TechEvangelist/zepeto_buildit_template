import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject, Object, Transform } from 'UnityEngine';
import AE_Character_Wardrobe_Clear from "../../../Scripts/InteractionSystem/Actions/AE_Character_Wardrobe_Clear";
import { DonationEventData } from "../Types";
import { WardrobeItemKeyword } from "../../../Wardrobe/Scripts/Types";

export default class DN_Wardrobe_Clear extends DonationTimedActionBase
{
    private ae: AE_Character_Wardrobe_Clear;

    public category: WardrobeItemKeyword;

    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Character_Wardrobe_Clear>();
        
        this.ae.category = this.category;
        this.ae.duration = this.duration;

        this.ae.Init();
    }

    DoAction(data: DonationEventData) {
        super.DoAction();
    }
}