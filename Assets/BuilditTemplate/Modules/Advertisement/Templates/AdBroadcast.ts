import { AdvertisementActionBase } from "./AdvertisementActionBase";
import AE_Character_SendChat from "../../Scripts/InteractionSystem/Actions/AE_Character_SendChat";
import MotionModifier from "../../Scripts/MotionModifier";

export default class AdBroadcast extends AdvertisementActionBase
{
    
    Start() {
        super.Start();
        
        let ae = this.GetComponentInChildren<AE_Character_SendChat>();
        ae.Init();
    }
}
