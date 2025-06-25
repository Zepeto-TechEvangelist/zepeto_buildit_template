import { Coroutine, GameObject, Transform } from "UnityEngine";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { ZepetoAction1 } from '../Utility/ZepetoEvent';

export interface IActionBase {
    DoAction?(action?: ActionBase): void;
    // CoDoAction?(index: number, action: ActionBase, ended: ZepetoAction1<number>): Generator<any, void, unknown>;
}

export abstract class ActionBase extends ZepetoScriptBehaviour implements IActionBase {

    @HideInInspector() public scriptName: string = null;

    // Start() {
    //     this.Init();
    // }

    public Init() {};

    public abstract DoAction(action?: ActionBase);
}
