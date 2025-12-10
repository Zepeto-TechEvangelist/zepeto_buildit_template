import {ZepetoScriptableObject, ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {GameObject} from 'UnityEngine';
import {ZepetoToast} from "ZEPETO.World.Gui";
import {Type} from "ZEPETO.World.Gui.ZepetoToast";
import {DonationActionSettings, DonationEventData, DonationSettings} from "./Types";
import DonationController from "./DonationController";
import {LiveDonationEventHandler, LiveDonationEventMessage} from "ZEPETO.Module.LiveDonation";

import DonationConfig from "./DonationConfig";
import DonationDisplay from "./DonationDisplay";
import DonationControlBoard, { BoardState } from "./DonationControlBoard";
import Localization from '../../Localization/ZepetoScript/Localization';

import { DonationLocalization } from './Localization';
import UIManager from "../../Scripts/UIManager";

/**
 * Donation Manager
 * high level class that handles live stream donation events and connects to
 * behaviours in the world.
 */
export default class DonationManager extends ZepetoScriptBehaviour {
    
    public donationEnabled: bool;
    
    public static get DonationEnabled(): bool { return this._managerInitialized /* config related property */ }
    private static _managerInitialized: bool = false;

    /**
     * Main configuration file
     */
    public configuration: ZepetoScriptableObject<DonationConfig>;
    
    private _config: DonationConfig;
    
    @HideInInspector() 
    public settings: DonationSettings = new DonationSettings();
    
    @HideInInspector() 
    public display: DonationDisplay;
    
    @HideInInspector() 
    public board: DonationControlBoard;

    public donationMap: Map<int, string>;

    private controllers: DonationController[] = [];

    public get Controllers(): DonationController[] { return this.controllers }


    /** -------------------------------------------------------------------------------------------------------- */

    /**
     * Donation event handler
     * @param event
     * @constructor
     */
    public Donate(event: DonationEventData) {
        this.display?.OnDonationEvent(event);
        
        if (event.currency_type == "zem") {
            
            // TODO: Detailed Logic
            const action = this.settings.actions.find(x => x.amount <= event.amount);
            
            if (action) {
                const controller = this.controllers.find(x => x.HasAction && x.Action.id == action.id);

                controller.Trigger.data = event;
                controller.Trigger.Fire();
            }

            const notificationText = DonationLocalization.ReceiveNotification
            (
                event.sender_nickname,
                event.amount,
                action.text ?? ""
            );

            ZepetoToast.Show(Type.None, notificationText);
        }
    }
    
    private OnMyLiveDonationEvent(message: LiveDonationEventMessage) {
        const event = {
            sender: "", // Id parameter empty in framework
            sender_nickname: message.sender_nickname,
            sender_profile: message.sender_profile,
            currency_type: message.currency_type,
            amount: message.amount
        };
        this.Donate(event);
    }
    
    private Initialize() {
        
        // Load settingss from configuration
        this._config = this.configuration.targetObject;
        
        this.donationEnabled = this._config.donationEnabled;
        
        if (this.donationEnabled == false) {
            this.transform.parent.gameObject.SetActive(false);
            return;
        }
        
        LiveDonationEventHandler.OnLiveDonationEvent.AddListener((message) => {
            // Intentionally left blank
        });
        
        LiveDonationEventHandler.OnMyLiveDonationEvent.AddListener((message) => { this.OnMyLiveDonationEvent(message) });
        
        // Initialized status
        DonationManager._managerInitialized = true;
    }


    /** -------------------------------------------------------------------------------------------------------- */
    
    /**
     * Register a controller for donation events
     * @param controller
     * @constructor
     */
    public RegisterController(controller: DonationController) {
        if (this.controllers.find(x => x === controller)) 
            return;
        
        // Add the controller to the pool
        this.controllers.push(controller);
        
        // Add the action to the pool
        const id = controller.Action.id;
        const amount = controller.Action.amount;
        const name = DonationLocalization.ActionDisplayName(id);
        
        this.settings.actions.push( new DonationActionSettings(id, amount, name) );
        
        // Notify changes
        this.board?.UpdateState();
    }

    /**
     * Unregister a controller from receiving donation events
     * @param controller
     * @constructor
     */
    public UnregisterController(controller: DonationController) {
        let index = this.controllers.findIndex(x => x === controller);
        if (index == -1) return;
            
        this.controllers.splice(index, 1);
        
        index = this.settings.actions.findIndex(x => x.id == controller.id);
        this.settings.actions.splice(index, 1);
        
        // Notify changes
        this.board?.UpdateState();
    }

    
    public RegisterDisplay(display: DonationDisplay) {
        this.display = display;
        // this.donationEnabled ? display.Show() : display.Hide();
        (this.board.state == BoardState.Hidden) ? this.display?.Hide() : this.display?.Show();
    }
    
    public RegisterBoard(board: DonationControlBoard) {
        this.board = board;
        // this.donationEnabled ? board.Show() : board.Hide();
    
        this.SetUIState(this.board.state);
    }
    
    /** -------------------------------------------------------------------------------------------------------- */
    /** General accessors */
    
    public ToggleBoardState() {
        
        // Toggle states
        let state = this.board.state;
        if (state == BoardState.Edit)
            state = BoardState.Display;
        else if (state == BoardState.Hidden)
            state = this._config.editActionsEnabled ? BoardState.Edit : BoardState.Display;
        else
            state = BoardState.Hidden;
        
        this.SetUIState(state);
    }
    
    public SetUIState(state: BoardState) {
        this.board?.SetState(state);
        (state == BoardState.Hidden) ? this.display?.Hide() : this.display?.Show();
    }
    
    public SetUIHidden(hidden: boolean) {
        this.donationEnabled = hidden;
        
        if (hidden) {
            this.board?.Hide();
            this.display?.Hide();
            // UIManager.instance.donationToggle.gameObject.SetActive(false);
        }
        else {
            this.board?.Show();
            this.display?.Show();
            // UIManager.instance.donationToggle.gameObject.SetActive(true);
        }
    }
    
    /** -------------------------------------------------------------------------------------------------------- */
    /** Singleton */
    
    private static m_instance: DonationManager = null;
    
    public static get instance(): DonationManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<DonationManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(DonationManager.name).AddComponent<DonationManager>();
            }
        }
        return this.m_instance;
    }
    
    
    private Awake() {
        if (DonationManager.m_instance !== null && DonationManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            DonationManager.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
        
        this.Initialize();
    }
    
    Destroy() {
        // Clear events
        LiveDonationEventHandler.OnMyLiveDonationEvent.RemoveAllListeners();// RemoveListener(this.OnMyLiveDonationEvent);
    }

    /** -------------------------------------------------------------------------------------------------------- */
    // Tests

    public TestDonation10() {
        this.TestDonation(10);
    }
    public TestDonation50() {
        this.TestDonation(50);
    }
    public TestDonation100() {
        this.TestDonation(100);
    }
    public TestDonation500() {
        this.TestDonation(500);
    }
    public TestDonation1000() {
        this.TestDonation(1000);
    }

    public TestDonation(amount: number) {
        const eventdata: DonationEventData = {
            sender: "",
            sender_nickname: "Buildit Tester",
            currency_type: "zem",
            amount: BigInt(amount)
        };
        this.Donate(eventdata);
    }
}