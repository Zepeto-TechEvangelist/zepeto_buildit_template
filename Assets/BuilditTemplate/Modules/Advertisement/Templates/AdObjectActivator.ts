import type { GameObject } from 'UnityEngine';
import AE_GameObject_SetActive from "../../Scripts/InteractionSystem/Actions/AE_GameObject_SetActive";
import { AdvertisementActionBase } from "./AdvertisementActionBase";

export default class AdObjectActivator extends AdvertisementActionBase
{
    public objectToActivate: GameObject;
    public objectToDeactivate: GameObject;
    
    Start() {
        super.Start();
        
        let aes = this.GetComponentsInChildren<AE_GameObject_SetActive>();
        
        if (aes.length > 0)
            aes[0].targetObject = this.objectToActivate;
        if (aes.length > 1)
            aes[1].targetObject = this.objectToDeactivate;
        
        aes.forEach(x => x.Init());
    }
}
