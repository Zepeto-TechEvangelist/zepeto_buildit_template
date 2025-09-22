import { GameObject, Object, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper, ZepetoScreenOrientation } from 'ZEPETO.World';
import { UnityEvent } from "UnityEngine.Events";
import { Button } from 'UnityEngine.UI';
import WardrobeController from '../Wardrobe/Scripts/WardrobeController';
import UIMenuController from '../Wardrobe/Scripts/UIMenuController';

export default class UIManager extends ZepetoScriptBehaviour {

    public wardrobeToggle: Button;
    public wardrobe: GameObject;
    
    public gestureMenu: GameObject;
    public gestureToggle: Button;
    
    // public menus: GameObject[] = [];
    
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
        
        let wardrobeController = this.wardrobe.GetComponent<WardrobeController>();
        let wardrobeMenu = this.wardrobe.GetComponent<UIMenuController>();
        
        this.wardrobeToggle.onClick.AddListener(() => { wardrobeMenu.ToggleMenu(); });
    }
    
    public SetVisible(visible: boolean) {
        this.gameObject.SetActive(visible);
    }
    
}