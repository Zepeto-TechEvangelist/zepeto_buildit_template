import type { GameObject, Transform } from 'UnityEngine';
import AE_Vehicle_Spawner from "../../Scripts/InteractionSystem/Actions/AE_Vehicle_Spawner";
import { AdvertisementActionBase } from "./AdvertisementActionBase";

export default class AdVehicleSpawner extends AdvertisementActionBase
{
    public vehiclePrefab : GameObject;
    public spawnPoint : Transform;
    public lifeTime : number;

    Start() {
        super.Start();

        let ae = this.GetComponentInChildren<AE_Vehicle_Spawner>();
        ae.targetObject = this.vehiclePrefab;
        ae.targetLocation = this.spawnPoint;
        ae.duration = this.lifeTime;
    }
}
