import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {Canvas, Camera, Vector3, Object, GameObject, Collider, Random, AudioSource, Color} from 'UnityEngine';
import { Button, Image } from 'UnityEngine.UI';
import { RoundedRectangleButton } from 'ZEPETO.World.Gui';

export default class BGMManager extends ZepetoScriptBehaviour {

    public muted: bool = false;
    
    public playOnStart: bool = true;

    @SerializeField()
    private toggle: RoundedRectangleButton;
    
    @SerializeField()
    private tracks: AudioSource[];
    
    private currentTrack: AudioSource;
    
    // TODO: Move this to new button struct 
    private _icon: Image;
    private _normalColor: Color;
    private _disabledColor: Color;
    private _normalFill: number;
    
    Awake() {
        
        // Get all BGM objects in the scene
        if (this.tracks.length == 0)
            this.tracks = Object.FindObjectsOfType<AudioSource>(false).filter(x => x.gameObject.name == "BGM");
        
        if (!(this.tracks.length > 0)) {
            this.toggle.gameObject.SetActive(false);
            return;
        }
        
        // Mute tracks for manual control
        this.tracks?.forEach(x => { x.playOnAwake = false; });   
    
        // UI binding
        this.toggle ??= GameObject.Find("BGMToggle").GetComponent<RoundedRectangleButton>();
        this.toggle?.OnClick.AddListener( () => { this.ToggleMute();});
        this._icon = this.toggle.GetComponentInChildren<Image>();
        
        this._normalFill = this.toggle.FillAmount;
        this._normalColor = this._icon.color;
        this._disabledColor = this.toggle.IconColor;
    }
    
    Start() {
        this.currentTrack = this.tracks[0];
        
        if (this.currentTrack != null && 
            this.muted == false && 
            this.playOnStart)
            this.currentTrack?.Play();
    }
    
    public ToggleMute() {
        if (this.muted)
            this.Unmute();
        else
            this.Mute();
    }
    
    public Mute() {
        this.muted = true;
        this._icon.color = this._disabledColor;
        // this.toggle.FillAmount = 0.9;
        
        this.currentTrack?.Pause();
    }
    
    public Unmute() {
        this.muted = false;
        this._icon.color = this._normalColor;
        // this.toggle.FillAmount = this._normalFill;
        this.currentTrack?.UnPause();
    }
}