import { ActionBase } from "../ActionBase";
import type { ZepetoScriptBehaviourComponent } from "ZEPETO.Script";

export default class AE_Script_Invoke extends ActionBase {
    
    public scriptObject: ZepetoScriptBehaviourComponent;
    public functionName: string;

    override DoAction(): void {
        this.scriptObject.Invoke(this.functionName);
    }
}
