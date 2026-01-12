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
    private tracks: AudioSource[];
    
    private currentTrack: AudioSource;
    
    Awake() {
        
        // Get all BGM objects in the scene
        if (this.tracks.length == 0)
            this.tracks = Object.FindObjectsOfType<AudioSource>(false).filter(x => x.gameObject.name == "BGM");
        
        // Mute tracks for manual control
        this.tracks?.forEach(x => { x.playOnAwake = false; });
    }
    
    Start() {
        if (this.tracks.length < 1) {
            // Remove the Icon
            return;
        }
        
        
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
        this.currentTrack?.Pause();
    }
    
    public Unmute() {
        this.muted = false;
        this.currentTrack?.UnPause();
    }
}