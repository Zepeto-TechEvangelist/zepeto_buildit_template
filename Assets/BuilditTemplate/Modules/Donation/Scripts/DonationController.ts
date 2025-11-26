import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { GameObject, Transform, Object } from "UnityEngine";
import { UnityEvent } from "UnityEngine.Events";
import DonationManager from "./DonationManager";
import { DonationTrigger } from "./DonationTrigger";
// import { IActionBase } from "../../Scripts/InteractionSystem/ActionBase";
import { IDonationActionBase } from "./DonationActionBase";
import Action from "../../Scripts/InteractionSystem/Action";
import { ZepetoEvent, ZepetoEvent1, ZepetoEvent2 } from "../../Scripts/Utility/ZepetoEvent";


/**
 * Controller used for donation objects, 
 */
export default class DonationController extends ZepetoScriptBehaviour {
    
    public get id(): string { return this?._action.id }
    
    /**
     * Internal variable for {@link Action} property
     * @private
     */
    private _action?: IDonationActionBase;
    
    /**
     * The event target
     */
    public get Action(): IDonationActionBase|null 
    { 
        return this._action 
    }

    public set Action(value: IDonationActionBase) 
    { 
        this._action = value 
    }
    

    /**
     * Internal variable for {@link Trigger} property
     * @private
     */
    private _trigger?: DonationTrigger;

    /**
     * The trigger connected with the controller
     * @public
     */
    public get Trigger(): DonationTrigger|null { return this._trigger };
    
    public set Trigger(value: DonationTrigger) { this._trigger = value };


    /**
     *  Event connected with the trigger, it is executed when the trigger is fired
     *  @public
     */
    public get OnTrigger(): ZepetoEvent {
        if (this._onTrigger === null) 
            this._onTrigger = new ZepetoEvent();
        
        return this._onTrigger;
    }

    /**
     * Internal variable for {@link OnTrigger} property
     * @private
     */
    private _onTrigger?: ZepetoEvent;

    /**
     *  Does the controller have a trigger
     */
    public get HasTrigger(): boolean { return this._trigger !== null }

    /**
     *  Does the controller have a OnTrigger event 
     */
    public get HasEvent(): boolean { return this._onTrigger !== null }

    /**
     *  Does the controller have an Action
     */
    public get HasAction(): boolean { return this._action !== null }
    
    /**
     *  Is the controller initialized and connected
     */
    public get IsInitialized(): boolean { return this.HasTrigger && (this.HasEvent || this.HasAction) }
    
    
    // Start() {
    //     this.Initialize();
    // }
    
    public Initialize(action: IDonationActionBase) {
        
        this._action = action;
        
        // Internal on Trigger
        DonationManager.instance.RegisterController(this);

        // Use default if not set by manager
        this.Trigger ??= new DonationTrigger();

        this.Trigger.callback.add_handler((trigger, data) => {
            
            this._action?.DoAction(data);
            this._onTrigger?.Invoke();
        });
    }
}