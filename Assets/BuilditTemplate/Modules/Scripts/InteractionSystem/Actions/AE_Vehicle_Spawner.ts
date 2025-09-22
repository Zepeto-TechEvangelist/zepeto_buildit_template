import { ActionBase } from "../ActionBase";
import { GameObject, Object, Vector3, Transform, WaitForSeconds } from "UnityEngine";
import VehicleAttachController from "../../../Vehicle/Scripts/VehicleAttachController";
import VehicleManager from "../../../Vehicle/Scripts/VehicleManager";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";

export default class AE_Vehicle_Spawner extends ActionBase {
    public targetObject: Object;
    public targetLocation: Transform;
    public duration: number = -1;

    private attacher: VehicleAttachController;
    
    override DoAction(): void {

        const instance: GameObject = VehicleManager.instance.CreateVehicle(this.targetObject as GameObject, 
            this.targetLocation.position, 
            this.targetLocation.rotation);
        this.StartCoroutine(this.ObjectDestroyer(instance, this.duration));
    }
    
    private *ObjectDestroyer(obj: GameObject, timeout: number) {

        this.attacher = obj.transform.GetComponentInChildren<VehicleAttachController>();
        console.log("Checking attacher set destroy :" + this.attacher)
        if (this.attacher)
            this.attacher.destroyOnLeave = true;
        
        yield new WaitForSeconds(0.1);

        this.attacher ??= obj.transform.GetComponentInChildren<VehicleAttachController>();

        console.log("Sending Local Player Get In")
        // Get in player used to not signal multiplay room
        this.attacher?.GetInPlayer(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer);
        
        if (this.duration > 0) {
            yield new WaitForSeconds(timeout);
            if (obj && this.attacher && this.attacher.isAttached) {
                this.attacher?.GetOut();
            }
        }
    }

}
