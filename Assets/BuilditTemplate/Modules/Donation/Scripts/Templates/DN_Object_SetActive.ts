import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject } from 'UnityEngine';
import AE_GameObject_SetActive from "../../../Scripts/InteractionSystem/Actions/AE_GameObject_SetActive";
import { DonationEventData } from "../Types";
import {AnimationClip, Time} from "UnityEngine";
import {ZepetoCharacter} from "ZEPETO.Character.Controller";

export default class DN_Object_SetActive extends DonationTimedActionBase
{
    private aes: AE_GameObject_SetActive[];
    
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
        this.aes = aes;
    }

    DoAction(data: DonationEventData) {
        super.DoAction();

        this.StartCoroutine(this.DelayReset(this.duration));
    }

    private *DelayReset(timeout: float = -1)
    {
        var hasTimeout: bool = timeout > 0 ? true : false;

        // Waiting for action loop
        while (true) {

            // Timeout interrupt
            if (hasTimeout) {
                timeout -= Time.deltaTime;
                if (timeout <= 0)
                    break;
            }

            yield;
        }
        
        const aes = this.aes;
        
        if (aes.length > 0)
            aes[0].targetObject = this.objectToDeactivate;
        if (aes.length > 1)
            aes[1].targetObject = this.objectToActivate;
        super.DoAction();
    }
}