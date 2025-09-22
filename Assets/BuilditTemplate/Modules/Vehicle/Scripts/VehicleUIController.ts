import {GameObject, Sprite} from "UnityEngine";
import {Button, Image } from "UnityEngine.UI";
import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import UIControllerTracker from "../../Gesture/ZepetoScript/UIControllerTracker";
import UIManager from "../../Scripts/UIManager";

export default class VehicleUIController extends ZepetoScriptBehaviour {
    
    public moveHandle: Image;
    public vehicleImage: Sprite;
    public normalImage: Sprite;
    
    public jumpButton: Button;
    public boostButton: Button;
    public getOutButton: Button;
    public hornButton: Button;
    public lightsButton: Button;

    
    private gestureInputTracker: UIControllerTracker;
    

    /* Singleton */
    private static m_instance: VehicleUIController = null;
    public static get instance(): VehicleUIController {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<VehicleUIController>();
            
            // if (this.m_instance === null) {
            //     this.m_instance = new GameObject(GroupManager.name).AddComponent<GroupManager>();
            // }
        }
        return this.m_instance;
    }
    private Awake() {
        VehicleUIController.m_instance = this;
        
        // if (VehicleUIController.m_instance !== null && VehicleUIController.m_instance !== this) {
        //     GameObject.Destroy(this.gameObject);
        // } else {
        //     VehicleUIController.m_instance = this;
        //     if (this.transform.parent === null)
        //         GameObject.DontDestroyOnLoad(this.gameObject);
        // }
    }
    
    Start() {
        this.gestureInputTracker = this.GetComponent<UIControllerTracker>();
        
        this.SetCharacterMode();    // default setup
    }
    
    
    public SetDriveMode(boostEnabled: boolean = true, hornEnabled: boolean = true, lightsEnabled: boolean = true) {
        this.moveHandle.sprite = this.vehicleImage;
        this.getOutButton.gameObject.SetActive(true);
        this.jumpButton.gameObject.SetActive(false);
        this.boostButton.gameObject.SetActive(boostEnabled);
        this.hornButton.gameObject.SetActive(hornEnabled);
        this.lightsButton.gameObject.SetActive(lightsEnabled);
        
        this.gestureInputTracker.enabled = false;
        this.HideAllMenus();
    }

    public SetPassengerMode() {
        this.moveHandle.sprite = this.vehicleImage;
        this.moveHandle.gameObject.SetActive(false);
        this.getOutButton.gameObject.SetActive(true);
        this.jumpButton.gameObject.SetActive(false);
        this.hornButton.gameObject.SetActive(false);
        this.lightsButton.gameObject.SetActive(false);
    }
    
    public SetCharacterMode() {
        this.moveHandle.sprite = this.normalImage;
        this.moveHandle.gameObject.SetActive(true);
        this.jumpButton.gameObject.SetActive(true);
        this.getOutButton.gameObject.SetActive(false);
        this.boostButton.gameObject.SetActive(false);
        this.hornButton.gameObject.SetActive(false);
        this.lightsButton.gameObject.SetActive(false);

        this.boostButton.onClick.RemoveAllListeners();
        this.hornButton.onClick.RemoveAllListeners();
        this.lightsButton.onClick.RemoveAllListeners();

        this.gestureInputTracker.enabled = true;
    }
    
    
    public HideAllMenus() {
        
        // Gesture
        UIManager.instance.gestureMenu?.SetActive(false);
    }
    
}