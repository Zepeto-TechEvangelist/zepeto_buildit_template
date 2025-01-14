import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractionIcon from './../Interaction/ZepetoScript/InteractionIcon';
import {GameObject, Transform, WaitForEndOfFrame, WaitForSeconds} from "UnityEngine";

import { EventAPI, CurrencyType, CurrencyEventCollectableObject } from 'ZEPETO.Module.Event';

export default class CollectableManager extends ZepetoScriptBehaviour {
    
    public sparkle: GameObject;
    
    private button: InteractionIcon;
    private static _isCollecting: boolean = false;
    private _isCollected: boolean = false;
    
    private collectable: CurrencyEventCollectableObject;
    
    private static activeManager: CollectableManager;
    
    private Start() {
        
        this.button = this.GetComponent<InteractionIcon>();
        this.collectable = this.GetComponent<CurrencyEventCollectableObject>();
        
        this.button.OnClickEvent.AddListener(() => {
            this.Collect();
        });
        
    }

    private Collect() {
        if (CollectableManager._isCollecting || this._isCollected) return;
        
        CollectableManager._isCollecting = true;
        this.button.HideIcon();
        this.button.enabled = false;
        
        EventAPI.TryCollect((eventName: string, currencyType: CurrencyType, amount: number) => 
            {
                console.log(eventName, currencyType, amount);
                
                this._isCollected = true;
                CollectableManager._isCollecting = false;
                
                this.StartCoroutine(this.OnEventSuccess());
            }, (errorCode, errorMsg) => {
                console.log(errorCode, errorMsg);

                this._isCollected = false;
                CollectableManager._isCollecting = false;
                
                this.button.enabled = true;
            }
        );
    }
    
    private * OnEventSuccess() {
        yield new WaitForEndOfFrame();
        
        yield new WaitForSeconds(1);
        
        this.sparkle.SetActive(false);
    }

}