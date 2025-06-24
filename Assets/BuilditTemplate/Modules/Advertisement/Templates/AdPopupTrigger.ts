import type { GameObject } from 'UnityEngine';
import AE_UI_ShowPopup from "../../Scripts/InteractionSystem/Actions/AE_UI_ShowPopup";
import {UnityEvent} from "UnityEngine.Events";
import { AdvertisementActionBase } from "./AdvertisementActionBase";

export default class AdPopupTrigger extends AdvertisementActionBase
{
    public title: string;
    public body: string;
    public buttonTitle: string = "OK";
    
    @HideInInspector()
    public buttonAction: UnityEvent;

    Start() {
        super.Start();

        let ae = this.GetComponentInChildren<AE_UI_ShowPopup>();
        ae.title = this.title;
        ae.body = this.body;
        ae.buttonTitle = this.buttonTitle;
        ae.buttonAction = this.buttonAction;
    }
}
