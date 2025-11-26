import {GameObject, Object} from 'UnityEngine';
import { DonationSettings, DonationEventData, DonationActionSettings } from "./Types";

export default class DonationConfig {
    @Tooltip("Enable or Disable donations in the world")
    enabled: boolean;
    
    @Header("Toast")
    Donation_TOAST: int;
    test: GameObject[];
}

class ActionSettings {
    id: string;
    amount: number;
}