import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoEvent1 } from '../Utility/ZepetoEvent'; 

export enum TriggerType {
    None,
    Ad,
    Click,
    Collider
}

export interface ITrigger {
    // get action?(): ActionBase;
    Fire?(): void;
}

export abstract class TriggerBase extends ZepetoScriptBehaviour implements ITrigger {
    
    public get type(): TriggerType { return TriggerType.None; }
    
    @HideInInspector()
    public callback: ZepetoEvent1<TriggerBase> = new ZepetoEvent1<TriggerBase>();
    
    Fire() {
        console.log("Trigger Fire");
        this.callback?.Invoke(this);
    }
}