import { ActionBase } from "../ActionBase";
import { GameObject, Object, Vector3 } from "UnityEngine";

export default class AE_Object_Spawner extends ActionBase {
    public targetObject: Object;
    public position: Vector3;
    
    override DoAction(): void {
         Object.Instantiate(this.targetObject);
    }
}
