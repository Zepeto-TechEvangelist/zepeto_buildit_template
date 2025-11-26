import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoEvent2 } from '../../Scripts/Utility/ZepetoEvent';
import { TriggerType, ITrigger } from "../../Scripts/InteractionSystem/Trigger";
import { DonationEventData } from "./Types";

/**
 * Trigger associated with a donation event
 * it also contains donation event data
 * - sender
 * - amount
 * - currency
 * - item
 */
export class DonationTrigger implements ITrigger {

    public get type(): TriggerType { return TriggerType.Donation; }

    private _data?: DonationEventData;
    
    public set data(value :DonationEventData) { this._data = value }
    
    /**
     * Donation sender
     */
    public get sender(): string { return this._data.sender }

    /**
     * Donation amount
     */
    public get amount(): bigint { return this._data.amount }

    /**
     * Donation currency type
     */
    public get currency_type(): string { return this._data.currency_type }

    // /**
    //  * Donation item
    //  */
    // public get item_id(): string { return this._data.item_id }
    
    
    // @HideInInspector()
    public callback: ZepetoEvent2<DonationTrigger, DonationEventData> = new ZepetoEvent2<DonationTrigger, DonationEventData>();

    Fire() {
        this.callback.Invoke(this, this._data);
    }
    
}