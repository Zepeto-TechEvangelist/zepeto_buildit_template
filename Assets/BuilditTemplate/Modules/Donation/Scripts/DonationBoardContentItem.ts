import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { GameObject, Transform, Object } from "UnityEngine";
import { ZepetoText, RoundedRectangleButton } from "ZEPETO.World.Gui";
import DonationManager from "./DonationManager";
import { DonationActionSettings } from "./Types";
import { InputField } from "UnityEngine.UI";
import { TMP_InputField, TMP_Text } from "TMPro";

/**
 * Controller used for donation objects,
 */
export default class DonationBoardContentItem extends ZepetoScriptBehaviour {

    public amount: TMP_Text;
    public itemId: ZepetoText;
    public text: TMP_Text;
    
    public inputAmount: TMP_InputField;
    public inputText: TMP_InputField;
    
    public config: DonationActionSettings;
    
    public SetContent(config: DonationActionSettings) {
        
        this.config = config;
        
        this.itemId.text = config.id;
        this.inputAmount.text = `${config.amount}`;
        this.amount.text = `${config.amount}`;
        this.inputText.text = config.text;
        this.text.text = config.text;
        
        this.UpdateUI();
    }
    
    public get AmountValue(): int { return parseInt(this.amount.text); } 
    
    public get HasChanges(): boolean { return this.config.amount != this.AmountValue || this.config.text !== this.text.text }
    
    public GetContent(): DonationActionSettings {

       this.config.amount = this.AmountValue;
       this.config.text = this.text.text;
       return this.config;   
    }
    
    public UpdateUI() {
        
        this.inputText.CalculateLayoutInputHorizontal();
        this.inputAmount.CalculateLayoutInputHorizontal();
    }
    
    public SetEditMode(enabled: boolean) {
        this.inputText.interactable = enabled;
        this.inputAmount.interactable = enabled;
        this.itemId.gameObject.SetActive(enabled);
    }
}