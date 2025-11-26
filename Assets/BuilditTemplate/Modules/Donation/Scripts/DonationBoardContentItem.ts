import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { GameObject, Transform, Object } from "UnityEngine";
import { ZepetoText, RoundedRectangleButton } from "ZEPETO.World.Gui";
import DonationManager from "./DonationManager";
import { DonationActionSettings } from "./Types";
import { InputField } from "UnityEngine.UI";

/**
 * Controller used for donation objects,
 */
export default class DonationBoardContentItem extends ZepetoScriptBehaviour {

    public amount: ZepetoText;
    public itemId: ZepetoText;
    public text: ZepetoText;
    
    public inputAmount: InputField;
    public inputText: InputField;
    
    public config: DonationActionSettings;
    
    public SetContent(config: DonationActionSettings) {
        
        this.config = config;
        
        this.itemId.text = config.id;
        this.inputAmount.text = `${config.amount}`;
        this.amount.text = `${config.amount}`;
        this.inputText.text = config.text;
        this.text.text = config.text;
    }
    
    public get AmountValue(): int { return parseInt(this.amount.text); } 
    
    public get HasChanges(): boolean { return this.config.amount != this.AmountValue || this.config.text !== this.text.text }
    
    public GetContent(): DonationActionSettings {

       this.config.amount = this.AmountValue;
       this.config.text = this.text.text;
       return this.config;   
    }
    
    public UpdateUI() {
        
    }
    
    public SetEditMode(enabled: boolean) {
        this.inputText.interactable = enabled;
        this.inputAmount.interactable = enabled;
        this.itemId.gameObject.SetActive(enabled);
    }
}