import {Quaternion, Time, Transform} from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class Chest extends ZepetoScriptBehaviour {

    public lid: Transform;
    public gold: Transform;
    public openRef: Transform;
    public closeRef: Transform;
    public openSpeed: number = 5;
    
    public isOpen: boolean = true;

    Update () {
        if(this.isOpen){
            this.SetRotation(this.openRef.rotation);
        }
        else{
            this.SetRotation(this.closeRef.rotation);
        }
    }
    
    private SetRotation(toRot: Quaternion) {
        if (this.lid.rotation != toRot) {
            this.lid.rotation = Quaternion.Lerp(this.lid.rotation, toRot, Time.deltaTime * this.openSpeed);
        }
    }
    
}