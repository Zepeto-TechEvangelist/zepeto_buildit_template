import { DonationActionBase } from "../DonationActionBase"
import type { GameObject } from 'UnityEngine';
import AE_UI_ShowToast from "../../../Scripts/InteractionSystem/Actions/AE_UI_ShowToast";
import { DonationEventData } from "../Types";

export default class DN_Toast extends DonationActionBase
{
    public message: string = "You just got ${amount} ZEM";
    private ae: AE_UI_ShowToast;
    
    Start() {
        super.Start();

        this.ae = this.GetComponentInChildren<AE_UI_ShowToast>();
    }
    
    DoAction(data: DonationEventData) {
        
        const amount = data.amount;
        
        this.ae.message = this.message.replace("${amount}", "" + amount);
        super.DoAction();
    }
}
