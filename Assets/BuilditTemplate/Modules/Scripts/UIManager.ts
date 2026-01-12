import {GameObject, Screen, ScreenOrientation} from 'UnityEngine';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {UnityAction$1, UnityEvent, UnityEvent$1} from "UnityEngine.Events";
import {Button} from 'UnityEngine.UI';
import UIButtonToggle, {UIButtonToggleGroup} from "../UI/Scripts/UIButtonToggle";

export default class UIManager extends ZepetoScriptBehaviour {

    public menu: GameObject;
    
    public screenOrientation: ScreenOrientation;
    public screenshotOrientationChangeEvent: UnityEvent = new UnityEvent();
    
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
        
        this.screenOrientation = Screen.orientation;
    }

    private Destroy() {
        if (UIManager.m_instance == this)
            UIManager.m_instance = null;
    }

    private Start() {

        this.CreateToggleGroup("rotation", null,
            (isOn) => {
                this.ToggleScreenRotate();
            }
        );
    }

    public SetVisible(visible: boolean) {
        this.gameObject.SetActive(visible);
    }
    
    public ToggleScreenRotate() {
        
        if (this.screenOrientation == ScreenOrientation.LandscapeLeft) {
            this.screenOrientation = ScreenOrientation.Portrait;
        }
        else {
            this.screenOrientation = ScreenOrientation.LandscapeLeft;
        }

        Screen.orientation = this.screenOrientation;
        this.screenshotOrientationChangeEvent.Invoke();
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
        const toggle: UIButtonToggle = this.menu.GetComponentsInChildren<UIButtonToggle>(true)
                        .find(x => x.toggleGroupKey == key);
        
        console.log(toggle);
        if (!toggle) {
            return null;
        }

        toggle.gameObject.SetActive(true);
        
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
    
    public SetEnabled(key: string, enabled: bool) {
        this.toggleGroups.get(key).toggle.button.enabled = enabled;
    }
    
}
