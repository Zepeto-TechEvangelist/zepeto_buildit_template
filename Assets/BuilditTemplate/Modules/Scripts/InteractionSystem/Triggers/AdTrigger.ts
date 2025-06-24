import { TriggerType, TriggerBase } from '../Trigger'
import AdvertisementController  from '../../../Advertisement/AdvertisementManager';


export default class AdTrigger extends TriggerBase {

    public override get type(): TriggerType { return TriggerType.Ad; }
    
}