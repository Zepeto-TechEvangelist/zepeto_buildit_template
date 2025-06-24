import { AdvertisementActionBase } from "./AdvertisementActionBase";
import AE_GameObject_SetActive from "../../Scripts/InteractionSystem/Actions/AE_GameObject_SetActive";

export default class AdCheckpoint extends AdvertisementActionBase {
    
    Start() {
        super.Start();

        let aes = this.GetComponentsInChildren<AE_GameObject_SetActive>();
        aes.forEach(x => x.Init());
    }
}