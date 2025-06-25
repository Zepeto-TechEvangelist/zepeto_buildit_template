import { ZepetoChat } from "ZEPETO.Chat";
import { MathUtils } from "../../Utility/MathUtils";
import { ActionBase } from "../ActionBase";
import { WorldMultiplayChatContent} from 'ZEPETO.World';

export default class AE_Character_SendChat extends ActionBase {
    public isLocalized: boolean;
    public texts: string[];

    override DoAction(): void {
        const index: number = MathUtils.RandomInt(this.texts.length);
        const text: string = this.texts[index];
        
        WorldMultiplayChatContent.instance.SendQuickMessage(text)
    }
}