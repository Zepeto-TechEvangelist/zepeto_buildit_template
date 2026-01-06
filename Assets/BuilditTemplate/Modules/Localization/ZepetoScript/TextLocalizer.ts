import { Text } from "UnityEngine.UI";
import { WaitForSeconds } from "UnityEngine";
// import { ZepetoText } from "ZEPETO.World.Gui";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import Localization from "./Localization";

export default class TextLocalizer extends ZepetoScriptBehaviour {
    public localizationKey: string;
    public disableRichText: boolean;

    private _uiText: Text;
    public _localizedText: string;
    
    // private _zepetoText: ZepetoText;
    
    public get localizedText() {
        if (!this._localizedText) {
            this._localizedText = "Not localized yet";
        }
        return this._localizedText;
    }

    Start() {
        if (!this.localizationKey || this.localizationKey == "") {
            console.error(`[TextLocalizer] Text Localizer is not initialized. Enter localization key first.(${this.gameObject.name})`);
            return;
        }

        //When UI text doesn't exist
        if (!this.GetComponent<Text>()) {
            console.error(`[TextLocalizer] Text Localizer is not initialized. There's no UI Text. (${this.gameObject.name})`);
            return;
        }

        this._uiText = this.GetComponent<Text>();
        this.UpdateTextContent();
    
        // this.StartCoroutine(this.LazyInit);
        
        Localization.instance.languageOptionChanged.AddListener(()=> {
            this.UpdateTextContent();
        });
    }
    
    private *LazyInit() {
        yield new WaitForSeconds(0.4);
        
        this.UpdateTextContent();
    }

    private UpdateTextContent() {
        Localization.instance.ApplyLocalization(this._uiText, this.localizationKey);
        this._localizedText = Localization.instance.GetLocalizedText(this.localizationKey);
        this._uiText.supportRichText = !this.disableRichText;
    }
}