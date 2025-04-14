import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Transform, Time, GameObject } from 'UnityEngine';
import { UnityEvent } from 'UnityEngine.Events';

export interface FXPlaybackControl {
    /**
     *  Start playback
     */
    Play()
    /**
     *  Pause the playback, doesn't change the play time
     */
    Pause()

    /**
     *  Restart the playback from the start
     */
    Restart()

    /**
     *  Stop all playback
     */
    Stop()
}

export abstract class FXBase extends ZepetoScriptBehaviour implements FXPlaybackControl {

    @Tooltip("Duration of the effect")
    public duration: float;

    @Tooltip("Activate on startup")
    public playOnAwake: boolean;
    
    @Tooltip("")
    public updateFirstFrame: boolean;
    
    @Tooltip("Destroy the game object when finished")
    public destroyOnFinished: boolean;
    
    @Tooltip("Event fired when the effect starts")
    public OnStart: UnityEvent;
    
    @Tooltip("Event fired when the effect ends")
    public OnEnd: UnityEvent; 
    
    // Initialized state
    public get initialized(): boolean { return this._initialized; }
    private _initialized: boolean;
    
    // Is the effect playing
    public get playing(): boolean { return this._playing; }
    private _playing: boolean;
    
    // Elapsed time
    public get time(): float { return this._time; }
    protected _time: float;

    /**
     * Playback progress in percent, value between 0 and 1
     */
    public get progress(): float { return this.time / this.duration; }
    
    /** ------------------------------------------------------------------------ */
    // Playback functions

    /**
     * @inheritdoc
     */
    public Play() {
        if (this._playing)
            return;
        
        if (this._time == 0) {
            this.Prepare();
        }
        
        this._playing = true;
        this.OnStart?.Invoke();
    }
    
    public Pause() {
        if (this._playing == false)
            return;
        
        this._playing = false;
    }
    
    public Restart() {
        this._playing = false;
        this._time = 0;
        
        this.Play();
    }
    
    public Stop() {
        if (this._playing == false)
            return;
        this._playing = false;
        
        this._Finish();
        
        this._time = 0;
    }

    /** ------------------------------------------------------------------------ */


    /** ------------------------------------------------------------------------ */
    // Behaviour events
    
    protected Awake() {
        this._Initialize();
    }
    
    protected Start() {
        if (this.playOnAwake)
            this.Play();
    }
    
    protected Update() {
        if (false == this._playing) 
            return;

        this._time += Time.deltaTime;
        // Normalize the time (normalized time)
        if (this._time > this.duration)
            this._time = this.duration;

        // The Timed function
        this.TimeFunction();
        
        if (this.duration <= this._time) {
            this._Finish();
        }
    }

    /** ------------------------------------------------------------------------ */
    // Private abstract derived methods
    
    private _Initialize() {
        if (this._initialized)
            return;

        this.Initialize();

        this._initialized = true;
    }
    
    private _Finish() {

        this.Finish();
        
        this.OnEnd?.Invoke();

        if (this.destroyOnFinished)
            GameObject.Destroy(this.gameObject);
    }
    
    /** ------------------------------------------------------------------------ */
    //  Abstract methods

    /**
     * Initialize properties and setup,
     * Timing: Called on Awake
     * @constructor
     * @protected
     */
    protected abstract Initialize();

    /**
     * Prepare for playback
     * Timing: Called before Playback starts
     * @constructor
     * @protected
     */
    protected abstract Prepare();

    /**
     * Progress timing function
     * Timing: Called on Update
     * @constructor
     * @protected
     */
    protected abstract TimeFunction();

    /**
     * Finish the plyaback and do cleanup
     * Timing: Called when effect playback ends, either by duration or by calling Stop()
     * @constructor
     * @protected
     */
    protected abstract Finish();
}