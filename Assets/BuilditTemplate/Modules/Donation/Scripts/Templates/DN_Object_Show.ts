import { DonationTimedActionBase } from "../DonationActionBase"
import type { GameObject, Coroutine } from 'UnityEngine';
import AE_GameObject_SetActive from "../../../Scripts/InteractionSystem/Actions/AE_GameObject_SetActive";
import { DonationEventData } from "../Types";
import { Time } from "UnityEngine";
import {ZepetoCharacter} from "ZEPETO.Character.Controller";


export default class DN_Object_Show extends DonationTimedActionBase
{
    @Tooltip("The object that will be shown or hidden")
    public targetObject: GameObject;
    
    @Tooltip("Enable to show, Disable to hide objects")
    public showOption: boolean;

    private ae: AE_GameObject_SetActive;
    private _resetCoroutine?: Coroutine;
    
    Start() {
        super.Start();

        this.ae = this.GetComponentInChildren<AE_GameObject_SetActive>();
        this.ae.targetObject = this.targetObject;
        this.ae.activeOption = this.showOption;
        
        this.ae.Init();
    }

    DoAction(data: DonationEventData) {
        this.StopAllCoroutines();   // Clean previous actions
        
        this.ae.targetObject = this.targetObject;
        this.ae.activeOption = this.showOption;
        
        super.DoAction();
            
        this._resetCoroutine = this.StartCoroutine(this.DelayReset(this.duration, !this.showOption));
    }

    private *DelayReset(timeout: float = -1, showOption: boolean)
    {
        var hasTimeout: bool = timeout > 0 ? true : false;

        while (true) {
            if (hasTimeout) {
                timeout -= Time.deltaTime;
                if (timeout <= 0)
                    break;
            }
            yield;
        }

        this.ae.activeOption = showOption;
        super.DoAction();
    }
}