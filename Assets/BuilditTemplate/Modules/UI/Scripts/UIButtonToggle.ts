import {Color} from 'UnityEngine';
import {Button} from 'UnityEngine.UI';
import {UnityEvent$1, UnityEvent, UnityAction$1 } from "UnityEngine.Events";
import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import { ZepetoEvent1 } from "../../Scripts/Utility/ZepetoEvent";
import { EventSystem } from "UnityEngine.EventSystems";

/**
 * Requires button componeent
 */
export default class UIButtonToggle extends ZepetoScriptBehaviour {

    public isOn: boolean;
    public button: Button;
    public useCustomState: boolean = true;
    
    private _onValueChanged: UnityEvent$1<boolean>;
    public get onValueChanged(): UnityEvent$1<boolean> { 
        if (!this._onValueChanged) 
            this._onValueChanged = new UnityEvent$1<boolean>();
        return this._onValueChanged; 
    }
    
    public toggleGroupKey: string;
    
    public normalColor: Color;
    public selectedColor: Color;
    
    Awake() {
        this.button ??= this.GetComponent<Button>();
        
        if (this.button === null)
            this.button = this.gameObject.AddComponent<Button>();
        
        this.button.onClick.AddListener(() => {
            
            if (this.useCustomState == false)
                this.ToggleState();
            
            this.onValueChanged?.Invoke( this.isOn );
            // this.UpdateState(true);
        });
        
        
        this.normalColor = this.button.image.color;
        this.selectedColor = this.button.colors.selectedColor;

        // Reset selection algorithm for button
        // var colors = this.button.colors;
        // colors.selectedColor = this.normalColor;
        // this.button.colors = colors;
    }
    
    public ToggleState() {
        this.isOn = !this.isOn;
        
        this.UpdateState();
    }
    
    public Select() {
        this.SetSelected(true);
    }
    
    public Deselect() {
        this.SetSelected(false);
    }
    
    public SetSelected(selected: bool) {
        // if (selected == this.isOn) return;
        
        this.isOn = selected;
        this.UpdateState();
    }
    
    
    private UpdateState(invokeEvent: boolean = false) {
        
        // UI
        // var colors = this.button.colors;
        // colors.normalColor = this.isOn ? this.selectedColor : this.normalColor;
        // this.button.colors = colors;
        this.button.image.color = this.isOn ? this.selectedColor : this.normalColor;
        EventSystem.current.SetSelectedGameObject(null);
        // this.button.image.color = this.isOn ? this.selectedColor : this.normalColor;
        
        // this.button.image.enabled = false;
        // this.button.image.enabled = true;
        // this.button.Select();
        
        // Invoke event
        // if (invokeEvent)
        //     this.onValueChanged?.Invoke(this.isOn);
    }
}


export class UIButtonToggleGroup {
    public toggle: UIButtonToggle;
    public event: UnityEvent$1<boolean>;
    public key: string;
    
    constructor(key: string, toggle: UIButtonToggle, onValueChangedEvent: UnityEvent$1<boolean>, onToggleAction: UnityAction$1<boolean>) {
        this.key = key;
        this.toggle = toggle;
        this.event = onValueChangedEvent;
        
        // Manager > Toggle
        onValueChangedEvent?.AddListener((isOn) => { 
            toggle.SetSelected(isOn); 
        });
       
        // Toggle > Manager
        toggle.onValueChanged?.AddListener(onToggleAction);
    }
}