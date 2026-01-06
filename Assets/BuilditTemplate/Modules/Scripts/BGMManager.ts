import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {Canvas, Camera, Vector3, Object, GameObject, Collider, Random, AudioSource, Color} from 'UnityEngine';
import { Button, Image } from 'UnityEngine.UI';
import { RoundedRectangleButton } from 'ZEPETO.World.Gui';

import UIManager from "../Scripts/UIManager";
import {UnityEvent$1} from "UnityEngine.Events";

export default class BGMManager extends ZepetoScriptBehaviour {

    public muted: bool = false;
    
    public playOnStart: bool = true;

    @SerializeField()
    private toggle: Button;
    
    @SerializeField()
    private tracks: AudioSource[];
    
    private currentTrack: AudioSource;
    
    // TODO: Move this to new button struct 
    private _icon: Image;
    private _normalColor: Color;
    private _disabledColor: Color;
    private _normalFill: number;
    
    Awake() {

        // UI binding
        this.toggle ??= GameObject.Find("BGMToggle").GetComponent<Button>();


        // Get all BGM objects in the scene
        if (this.tracks.length == 0)
            this.tracks = Object.FindObjectsOfType<AudioSource>(false).filter(x => x.gameObject.name == "BGM");
        
        if (this.tracks.length < 1) {
            this.toggle.gameObject.SetActive(false);
            return;
        }
        
        // Mute tracks for manual control
        this.tracks?.forEach(x => { x.playOnAwake = false; });   
    
        // this.toggle?.onClick.AddListener( () => { this.ToggleMute();});
        // this._icon = this.toggle.GetComponentInChildren<Image>();
        
        // this._normalFill = this.toggle.FillAmount;
        // this._normalColor = this.toggle.colors.normalColor;
        // this._disabledColor = this.toggle.colors.selectedColor;
        // this._disabledColor = this._icon //this.toggle.IconColor;
    }
    
    Start() {
        this.currentTrack = this.tracks[0];
        
        if (this.currentTrack != null && 
            this.muted == false && 
            this.playOnStart)
            this.currentTrack?.Play();
        
        this.LateInit();
    }

    private _activeEvent: UnityEvent$1<boolean>;
    private LateInit() {

        this._activeEvent = new UnityEvent$1<boolean>();
        UIManager.instance.CreateToggleGroup("music", this._activeEvent, (isOn) => {
            if (isOn)
                this.Unmute();
            else
                this.Mute();
        });
        
        // Initialize
        if (this.muted)
            this.Mute();
        else
            this.Unmute();

        this._activeEvent?.Invoke(!this.muted);
    }
    
    public ToggleMute() {
        if (this.muted)
            this.Unmute();
        else
            this.Mute();
        
        this._activeEvent?.Invoke(!this.muted);
    }
    
    public Mute() {
        this.muted = true;
        // this.toggle.colors[0] = this._disabledColor;
        // this._icon.color = this._disabledColor;
        // this.toggle.FillAmount = 0.9;
        
        this.currentTrack?.Pause();
    }
    
    public Unmute() {
        this.muted = false;
        // this.toggle.colors[0] = this._normalColor;
        // this.toggle.FillAmount = this._normalFill;
        this.currentTrack?.UnPause();
    }
}