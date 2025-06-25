import {ZepetoScriptBehaviourComponent} from "ZEPETO.Script";
import {ZepetoAction1, ZepetoEvent} from '../Utility/ZepetoEvent';
import {ActionBase} from "./ActionBase";
// import {TriggerBase} from "./Trigger";


export default class Action extends ActionBase {

    public actionElements: ZepetoScriptBehaviourComponent[];

    private readonly _actionEnded = new ZepetoEvent();

    private _actionElements: ActionBase[] = [];
    
    public get elements(): ActionBase[] {
        if (!this._actionElements.length) {

            for (const x of this.actionElements) {
                let element = (x.script.EnsureInstance(x.script.context) as ActionBase);
                this._actionElements.push(element);
            }
        }

        return this._actionElements;
    }
    
    public Init() {}
    //
    //     // Note: compilation issue
    //     // this._actionElements = this.actionElements.flatMap<ActionBase>(x => {
    //     //     return x.script.EnsureInstance(x.script.context) as ActionBase 
    //     // });
    //
    //     // for (const action of this.elements) {
    //     //     action.Init();
    //     // }
    // }
    
    public DoAction(action?: ActionBase) {

        // Simultanious executiion
        for (const action of this.elements) {
            action.DoAction();
        }
    }
}
