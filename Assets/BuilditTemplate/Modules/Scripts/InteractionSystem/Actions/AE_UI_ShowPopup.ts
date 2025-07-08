import { ActionBase } from "../ActionBase";
import {UnityEvent} from "UnityEngine.Events";
import { PopupCommon, PopupCommonBuilder } from 'ZEPETO.World.Gui';
import * as ZepetoWorld from 'ZEPETO.World';

export default class AE_UI_ShowPopup extends ActionBase {
    public isLocalized: boolean;
    public title: string;
    public body: string;
    public buttonTitle: string = "OK";
    public buttonAction: UnityEvent;
    
    override DoAction(): void {

        let popup = PopupCommon.CreateInstance();
        
        popup.Initialize(new PopupCommonBuilder()
            .SetTitle(this.title)
            .SetBody(this.body)
            .SetOneButton(this.buttonTitle, () => {
                this.buttonAction?.Invoke();
                popup.Close();
            }));
    }
}

