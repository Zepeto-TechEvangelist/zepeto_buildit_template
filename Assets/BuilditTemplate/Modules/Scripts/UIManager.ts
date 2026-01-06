import { GameObject, Object, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper, ZepetoScreenOrientation } from 'ZEPETO.World';
import { UnityEvent, UnityEvent$1, UnityAction$1 } from "UnityEngine.Events";
import { Button } from 'UnityEngine.UI';
import WardrobeController from '../Wardrobe/Scripts/WardrobeController';
import UIMenuController from '../Wardrobe/Scripts/UIMenuController';
import DonationManager from "../Donation/Scripts/DonationManager";

import UIButtonToggle, { UIButtonToggleGroup } from "../UI/Scripts/UIButtonToggle";

export default class UIManager extends ZepetoScriptBehaviour {

    public menu: GameObject;
    
    public wardrobeToggle: Button;
    public wardrobe: GameObject;
    public gestureMenu: GameObject;
    public gestureToggle: Button;
    public donationToggle: Button;

    /* Singleton */
    private static m_instance: UIManager = null;

    public static get instance(): UIManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<UIManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(UIManager.name).AddComponent<UIManager>();
            }
        }
        return this.m_instance;
    }

    private Awake() {
        if (UIManager.m_instance !== null && UIManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            UIManager.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    private Destroy() {
        if (UIManager.m_instance == this)
            UIManager.m_instance = null;
    }

    private Start() {

        // let wardrobeController = this.wardrobe.GetComponent<WardrobeController>();
        // let wardrobeMenu = this.wardrobe.GetComponent<UIMenuController>();
        //
        // this.wardrobeToggle.onClick.AddListener(() => {
        //     wardrobeMenu.ToggleMenu();
        // });

        if (DonationManager.DonationEnabled) {
            // this.donationToggle.onClick.AddListener(() => {
            //     DonationManager.instance.ToggleBoardState();
            // });

            this.donationToggle.gameObject.SetActive(true);
        }
        
        
        
    }

    public SetVisible(visible: boolean) {
        this.gameObject.SetActive(visible);
    }
    
    private toggleGroups: Map<string, UIButtonToggleGroup> = new Map<string, UIButtonToggleGroup>();
    
    public RegisterToggleGroup(group: UIButtonToggleGroup) {
        this.toggleGroups.set(group.key, group);
    }

    /**
     * Create a toggle group from the available UI pool
     * 
     * @param key
     * @param onValueChangedEvent
     * @param onToggleAction
     * @returns UIButtonToggleGroup
     * @constructor
     */
    public CreateToggleGroup(key: string, onValueChangedEvent: UnityEvent$1<boolean>, onToggleAction: UnityAction$1<boolean>): UIButtonToggleGroup {

        // Get menu contents
        const toggle: UIButtonToggle = this.menu.GetComponentsInChildren<UIButtonToggle>()
                        .find(x => x.toggleGroupKey == key);
        
        if (!toggle) {
            return null;
        }
        console.log("[UIManager] Creating Toggle Group Key = " + key);
        const group = new UIButtonToggleGroup(key, toggle, onValueChangedEvent, onToggleAction);
        this.RegisterToggleGroup(group);
        
        return group;
    }
    
    // TODO: just testing with Select and Deselect actions, better utilization later
    public Show(key: string) {
        this.toggleGroups.get(key).toggle.Select();
    }
    
    public Hide(key: string) {
        this.toggleGroups.get(key).toggle.Deselect();
    }
    
}
