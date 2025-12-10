import { DonationActionBase } from "../DonationActionBase"
import type { Transform } from 'UnityEngine';
import AE_Player_Kill from "../../../Scripts/InteractionSystem/Actions/AE_Player_Kill";
import { DonationEventData } from "../Types";


export default class DN_Player_Kill extends DonationActionBase
{
    private ae: AE_Player_Kill;
    
    
    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Player_Kill>();
    }

    DoAction(data: DonationEventData) {
        super.DoAction();
    }
}
