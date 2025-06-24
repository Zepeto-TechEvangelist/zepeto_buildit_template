import type { Transform } from 'UnityEngine';
import { AdvertisementActionBase } from "./AdvertisementActionBase";
import AE_Character_TeleportToTarget from "../../Scripts/InteractionSystem/Actions/AE_Character_TeleportToTarget";

export default class AdTeleportToTarget extends AdvertisementActionBase
{
    public target: Transform;
    
    Start() {
        super.Start();
        
        let ae = this.GetComponentInChildren<AE_Character_TeleportToTarget>();
        ae.targetObject = this.target;
    }
}
