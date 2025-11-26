import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject, Object, Transform } from 'UnityEngine';
import AE_Object_Spawner from "../../../Scripts/InteractionSystem/Actions/AE_Object_Spawner";
import { DonationEventData } from "../Types";
import {AnimationClip, Time} from "UnityEngine";
import {ZepetoCharacter} from "ZEPETO.Character.Controller";

export default class DN_Object_Spawn extends DonationTimedActionBase
{
    private ae: AE_Object_Spawner;

    public targetObject: Object;
    public spawnLocation: Transform;


    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Object_Spawner>();

        this.ae.targetObject = this.targetObject;
        this.ae.targetLocation = this.spawnLocation;
        this.ae.duration = this.duration;
        
        this.ae.Init();
    }

    DoAction(data: DonationEventData) {
        super.DoAction();
    }
}