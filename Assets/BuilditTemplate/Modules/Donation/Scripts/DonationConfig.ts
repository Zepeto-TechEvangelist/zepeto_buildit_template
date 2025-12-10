import {GameObject, Object} from 'UnityEngine';
import { DonationSettings, DonationEventData, DonationActionSettings } from "./Types";

export default class DonationConfig {
    @Tooltip("Master switch: Disabling this option will turn off the donation system")
    public donationEnabled: boolean;
    
    @Tooltip("Enabling this option will allow users to adjust donation actions contents")
    public editActionsEnabled: boolean;
    
    // public editCost: int;
    
    // @Header("Default Donation Actions")
    // Donation_TOAST: int;
    // test: GameObject[];
}

class ActionSettings {
    id: string;
    amount: number;
}