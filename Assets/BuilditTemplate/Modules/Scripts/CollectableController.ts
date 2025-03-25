import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import {
    Application,
    Coroutine,
    GameObject,
    SystemLanguage, Time,
    Transform,
    WaitForEndOfFrame,
    WaitForSeconds, Color
} from "UnityEngine";

import { EventAPI, CurrencyType, CurrencyEventCollectableObject } from 'ZEPETO.Module.Event';
import Chest from './Chest';
import { ZepetoWorldContent } from 'ZEPETO.World';
import CollectableManager from './CollectableManager';
import {Button, Text} from 'UnityEngine.UI';
import InteractionIcon from './../Interaction/ZepetoScript/InteractionIcon';
import { TextMeshPro } from 'TMPro';

export default class CollectableController extends ZepetoScriptBehaviour {

    // Sparkling effect
    public sparkle: GameObject;
    
    // Chest object, 3D representation of the collectable object
    public chest: GameObject;

    // Countdown UI
    public countdown: TextMeshPro;
    
    // Delay before the collectable object can be obtained
    public timeout: number = 100;
    
    // Tag indicating the object has been activated and is waiting to be collected
    public isWaiting: bool;
    
    public activatedIconColor: Color;
    
    /// --- Private
    
    private _interactionButton: InteractionIcon;
    private _isCollected: boolean;
    private _chest: Chest;
    private _collectableObject: CurrencyEventCollectableObject;
    private _coTimer: Coroutine;
    
    private Start() {
        this._interactionButton = this.GetComponent<InteractionIcon>();
        this._collectableObject = this.GetComponent<CurrencyEventCollectableObject>();
        this._chest = this.chest.GetComponent<Chest>();

        this._interactionButton.OnClickEvent.AddListener(() => {
            this.Collect();
        });
    }
    
    private Collect() {

        if (this._isCollected)
            return;
        
        if (this.timeout > 0) {
            this.StartTimer();
            return;
        }
        
        if (CollectableManager.instance.Collect(this) == false)
            return;

        this._interactionButton.HideIcon();
        this._interactionButton.enabled = false;
    }
    
    
    
    private StartTimer() {
        if (this.isWaiting)
            return;
        
        CollectableManager.instance.ChestFound();
        
        this.isWaiting = true;
        
        this._interactionButton.HideIcon();
        this._interactionButton.enabled = false;
        
        this._coTimer = this.StartCoroutine(this.Step());
    }
    
    private *Step() {
        while (this.isWaiting) {
            this.countdown.text = `${this.timeout}`;
            yield new WaitForSeconds(1);
            // Update UI
            this.timeout-=1;
            
            if (this.timeout < 1)
                this.EndTimer();
        }
    }

    private EndTimer() {
        this.isWaiting = false;
        this.countdown.gameObject.SetActive(false);
        this._interactionButton.ShowIcon();
        this._interactionButton.enabled = true;

        let button: Button = this._interactionButton.gameObject.GetComponentInChildren<Button>();
        let colors = button.colors.get_Clone();
        colors.normalColor = this.activatedIconColor;
        button.colors = colors;
    }
    

    public OnCollected(success: boolean) {
        this._isCollected = success;
        this.StartCoroutine(this.OnEventSuccess());
        this.chest.GetComponent<Chest>()?.gold.gameObject.SetActive(success);
    }
    
    private * OnEventSuccess() {
        yield new WaitForEndOfFrame();

        this._chest.Open(true);
        this.sparkle.SetActive(false);
    }
}