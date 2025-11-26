import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { GameObject, Transform, Object } from "UnityEngine";

import DonationManager from "./DonationManager";
import { DonationSettings, DonationActionSettings, DonationEventData } from "./Types";
import type { ZepetoText } from "ZEPETO.World.Gui";


/**
 * Controller used for donation objects,
 */
export default class DonationDisplay extends ZepetoScriptBehaviour {
    public textGem: ZepetoText;
    public textCoin: ZepetoText;
    
    private _gems: number = 0;
    public get gems(): int { return this._gems }
    public set gems(value: int) { 
        this._gems = value;
        this.UpdateDisplay();
    }

    private _coins: number = 0;
    public get coins(): int { return this._coins }
    public set coins(value: int) {
        this._coins = value;
        this.UpdateDisplay();
    }
    
    public UpdateDisplay() {
        this.textGem.text = `${this.gems}`;
        this.textCoin.text = `${this.coins}`;
    }

    public OnDonationEvent(event: DonationEventData) {
        if (event.currency_type == "zem")
            this._gems += Number(event.amount);
        else
            this._coins += Number(event.amount);    // TODO: Concern about big int

        this.UpdateDisplay();
    }
    
    Start() {
        // TODO: Conditional binding
        DonationManager.instance.display = this;
        this.UpdateDisplay();
    }
}