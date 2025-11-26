

import Localization from '../../Localization/ZepetoScript/Localization';

// export namespace Donation {
    
    enum Keys {
        amount = "{amount}",
        sender = "{sender}",
        currencyType = "{type}",
        action = "{action}",
        zem = "BP_Desc_Zem",
        coin = "BP_Desc_Coin",
        receivedNotification = "BP_DN_ReceiveNoti",
        wrongAmount = "",
        //...
    }
    
    export class DonationLocalization {
        
        public static get Coin(): string { return Localization.instance.GetLocalizedText(Keys.coin) }
        
        public static get Zem(): string { return Localization.instance.GetLocalizedText(Keys.zem) }
        
        public static ReceiveNotification(sender: string, amount: bigint, action: string): string { 
            return Localization.instance.GetLocalizedText(Keys.receivedNotification)
                .replace(Keys.sender, sender)
                .replace(Keys.amount, amount.toString())
                .replace(Keys.currencyType, this.Zem)
                .replace(Keys.action, action)
        }
    }
// }