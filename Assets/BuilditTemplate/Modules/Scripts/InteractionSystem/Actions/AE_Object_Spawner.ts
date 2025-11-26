import { ActionBase } from "../ActionBase";
import { GameObject, Object, Vector3, Transform, WaitForSeconds } from "UnityEngine";
import { UnityAction, UnityAction$1 } from "UnityEngine.Events";

export default class AE_Object_Spawner extends ActionBase {
    public targetObject: Object;
    public targetLocation: Transform;
    public duration: number = -1;
    
    @HideInInspector() public onCreate?: UnityAction$1<Object>;
    @HideInInspector() public onDestroy?: UnityAction;
    
    override DoAction(): void {
         let instance = Object.Instantiate(this.targetObject, this.targetLocation);
         
         
         if (this.onCreate)
            this.onCreate(instance);
         
         if (this.duration > 0) {
            this.StartCoroutine(this.ObjectDestroyer(instance, this.duration));
         }
    }
    
    *ObjectDestroyer(obj: Object, timeout: number) {
        yield new WaitForSeconds(timeout);
        Object.Destroy(obj);
        
        if (this.onDestroy)
            this.onDestroy();
    }
    
}
