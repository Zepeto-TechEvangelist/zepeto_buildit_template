

import Localization from '../../Localization/ZepetoScript/Localization';

// export namespace Donation {
    
    enum Keys {
        amount = "{amount}",
        sender = "{sender}",
        currencyType = "{type}",
        action = "{action}",
        zem = "str_zem",
        coin = "str_coin",
        receivedNotification = "bp_dn_received",
        wrongAmount = "bp_dn_duplicate_amount",
        actionsSaved = "dp_dn_actions_saved",
        actionPrefix = "bp_action_"
        //...
    }
    
    export class DonationLocalization {
        
        public static get Coin(): string { return Localization.instance.GetLocalizedText(Keys.coin) }
        
        public static get Zem(): string { return Localization.instance.GetLocalizedText(Keys.zem) }
        
        public static get ErrorWrongAmount(): string { return Localization.instance.GetLocalizedText(Keys.wrongAmount) }

        public static get SuccessActionsSaved(): string { return Localization.instance.GetLocalizedText(Keys.actionsSaved) }
        
        public static ActionDisplayName(id: string) { return Localization.instance.GetLocalizedText(Keys.actionPrefix + id.toLowerCase()) }
        
        public static ReceiveNotification(sender: string, amount: bigint, action: string): string { 
            return Localization.instance.GetLocalizedText(Keys.receivedNotification)
                .replace(Keys.sender, sender)
                .replace(Keys.amount, amount.toString())
                .replace(Keys.currencyType, this.Zem)
                .replace(Keys.action, action)
        }
    }
// }