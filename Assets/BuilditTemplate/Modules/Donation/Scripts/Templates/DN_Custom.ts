import { DonationActionBase, DonationTimedActionBase } from "../DonationActionBase"
import { DonationEventData } from "../Types";


export default class DN_Custom extends DonationActionBase
{
    Start() {
        super.Start();
    }

    DoAction(data: DonationEventData) {
        super.DoAction(data);
    }
}
