import { ActionBase } from "../ActionBase";
import type { GameObject } from "UnityEngine";

export default class AE_GameObject_SetActive extends ActionBase {
    public targetObject: GameObject;
    public activeOption: boolean = true;

    Init() {
        this.targetObject?.SetActive(!this.activeOption);
    }
    
    override DoAction(): void {
        this.targetObject?.SetActive(this.activeOption);
    }
}
