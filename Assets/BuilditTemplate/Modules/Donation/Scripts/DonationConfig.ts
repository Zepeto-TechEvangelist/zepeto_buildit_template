import {GameObject, Object} from 'UnityEngine';
import { DonationSettings, DonationEventData, DonationActionSettings } from "./Types";

export default class DonationConfig {
    @Tooltip("Master switch: Disabling this option will turn off the donation system")
    public donationEnabled: boolean;
    
    @Tooltip("Enabling this option will allow users to adjust donation actions contents")
    public editActionsEnabled: boolean;
    
    // @Tooltip("")
    // public infoEnabled: boolean;
    
    @Tooltip("Display shown when Info is selected")
    public infoDisplay: GameObject;
}

class ActionSettings {
    id: string;
    amount: number;
}