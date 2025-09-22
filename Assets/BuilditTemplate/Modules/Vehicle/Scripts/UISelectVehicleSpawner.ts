import UISelectionPopup from "../../UI/Scripts/UISelectionPopup";
import {GameObject, Transform, WaitForSeconds} from "UnityEngine";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import VehicleManager from "./VehicleManager";
import VehicleAttachController from "./VehicleAttachController";

export default class UISelectVehicleSpawner extends UISelectionPopup {

    /**
     * Spawn location of the vehicle object
     */
    public spawnLocation: Transform;
    
    /**
     * Duration of the spawned vehicle, negative value for infinite
     */
    public duration: number = -1;

    /**
     * Should the vehicle be destroyed when getting out
     */
    public destroyOnLeave: boolean = true;
    
    
    protected OnAction(): void {

        // Cancel action if already driving
        if (VehicleManager.instance.isLocalPlayerDriving) 
            return;
        
        // console.log(this.selectable);
        // console.log(this.selectable.selectedItem);
        
        const asset = this.selectable.selectedItem.item as GameObject;
        
        const instance: GameObject = VehicleManager.instance.CreateVehicle(asset,
            this.spawnLocation.position,
            this.spawnLocation.rotation);

        let attacher = instance.transform.GetComponentInChildren<VehicleAttachController>();

        attacher.StartCoroutine(this.ObjectDestroyer(attacher, this.duration));

        super.OnAction();
    }

    private *ObjectDestroyer(attacher: VehicleAttachController, timeout: number) {
        
        if (attacher)
            attacher.destroyOnLeave = this.destroyOnLeave;

        yield new WaitForSeconds(0.1);
        
        // Get in player used to not signal multiplay room
        attacher?.GetInPlayer(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer);

        if (this.duration > 0) {
            yield new WaitForSeconds(timeout);
            
            if (attacher && attacher.isAttached)
                attacher?.GetOut();
            else
                attacher?.DestroyVehicle();
        }

        
    }
    
}