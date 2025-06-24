import type { GameObject } from 'UnityEngine';
import AE_UI_ShowToast from "../../Scripts/InteractionSystem/Actions/AE_UI_ShowToast";
import { AdvertisementActionBase } from "./AdvertisementActionBase";

export default class AdToastTrigger extends AdvertisementActionBase
{
    public message: string;

    Start() {
        super.Start();

        let ae = this.GetComponentInChildren<AE_UI_ShowToast>();
        ae.message = this.message;
        
    }
}
