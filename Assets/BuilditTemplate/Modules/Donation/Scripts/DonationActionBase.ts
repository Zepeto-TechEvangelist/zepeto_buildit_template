import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Action from "../../Scripts/InteractionSystem/Action";
import { IActionBase, ActionBase } from "../../Scripts/InteractionSystem/ActionBase";
import DonationController from "./DonationController";
import { DonationEventData, DonationActionSettings } from "./Types";


export abstract class DonationActionBase extends ZepetoScriptBehaviour implements IDonationActionBase {

    @Header("Basic Configuration")

    /**
     * Main advertisement identifier
     */
    @Tooltip("Main advertisement identifier, the same identifier is used for localization")
    public id: string;

    @Tooltip("Donation amount for triggering the action")
    public amount: number;
    
    // @Tooltip("Custom option")
    // public secret: boolean;
    
    @HideInInspector() public settings: DonationActionSettings;
    
    protected _action: Action;
    public get action(): Action 
    {
        if (this._action === null)
            this._action = this.GetComponentInChildren<Action>();
        
        return this._action;
    }

    protected _controller: DonationController;
    public get controller(): DonationController 
    { 
        if (this._controller === null)
            this._controller = this.GetComponentInChildren<DonationController>();
        
        return this._controller;
    }
    
    Awake() {
        this._action ??= this.GetComponentInChildren<Action>();
        this._controller ??= this.GetComponentInChildren<DonationController>();
    }

    Start() {
        // Indirect binding
        this._controller.Initialize(this);
    }
    
    DoAction(data?: DonationEventData) {
        this._action?.DoAction();
    }
}

export interface IDonationActionBase {
    get id(): string;
    get amount(): number;
    DoAction(data?: DonationEventData);
}

/**
 * Donation action base with a duration component
 */
export abstract class DonationTimedActionBase extends DonationActionBase {
    @Tooltip("Action duration(sec), infinite if value is 0 or lower")
    public duration: number;
}