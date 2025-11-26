/**
 * Settings used to configure donation system
 */
import { LiveDonationEventMessage } from "ZEPETO.Module.LiveDonation";

export class DonationSettings {
    actions: DonationActionSettings[] = []; 
}

export class DonationActionSettings {
    id: string;
    amount: int;
    text: string;
    
    constructor(id: string, amount: int, text: string) {
        this.id = id;
        this.amount = amount;
        this.text = text;
    }
}

export enum CurrencyType {
    zem = "zem",
    coin = "coin"
};

// In case the library is not available
// export interface LiveDonationEventMessage
// {
//     sender: string;
//     sender_nickname: string;
//     sender_profile: string;
//     receiver: string;
//     receiver_nickname: string;
//     receiver_profile: string;
//     currency_type: string;
//     amount: int;
//     item_id: string;
// }


export interface DonationEventData {
    sender?: string;
    sender_nickname?: string;
    sender_profile?: string;
    currency_type: string;
    amount: bigint;
}

