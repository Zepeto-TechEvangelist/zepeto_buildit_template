import { DonationActionBase } from "../DonationActionBase"
import type { Transform } from 'UnityEngine';
import AE_Character_TeleportToTarget from "../../../Scripts/InteractionSystem/Actions/AE_Character_TeleportToTarget";
import { DonationEventData } from "../Types";


export default class DN_TeleportToTarget extends DonationActionBase
{
    private ae: AE_Character_TeleportToTarget;
    public target: Transform;
    
    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Character_TeleportToTarget>();
    }

    DoAction(data: DonationEventData) {
        this.ae.targetObject = this.target;
        super.DoAction();
    }
}
