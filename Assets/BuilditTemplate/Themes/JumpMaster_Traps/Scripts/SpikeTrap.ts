import { Animator } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Timer from '../../../Modules/Scripts/Timer';
import { UnityEvent } from 'UnityEngine.Events';

export default class SpikeTrap extends ZepetoScriptBehaviour {

    // @Header("Basic Settings")
    
    @Tooltip("Waiting time between triggerring the trap. Firing animation time is calculated together.")
    public spikeActiveDuration: float;

    @Tooltip("Waiting time between triggerring the trap. Firing animation time is calculated together.")
    public spikeCooldownDuration: float;


    @HideInInspector()
    @Tooltip("Animation speed for the trap")
    public animationSpeed: float = 2.0;

    // @Header("")
    // @Header("________________________________________________________________________")
    //
    // @Header("Advanced Settings")

    @HideInInspector()
    @Tooltip("If enabled, timeout will be able to restart the trap animation before completing")
    public enableInterrupt: boolean = true;

    @HideInInspector()
    @Tooltip("Animation state name that is used for firing the trap")
    public animationStateName: string = "Open";
    
    @HideInInspector()
    @Tooltip("Number of trap firing count. Set a positive value or use -1 for infinite repeats.")
    public repeatCount: int = -1;
    
    
    private _minSpeed = 0.5;
    private _minTimeout = 0.5;
    private _minDelay = 0.5;
    // Settings
    
    private _fire: boolean = false;
    
    Start() {
        this.animationSpeed = Math.max(this._minSpeed, this.animationSpeed);
        this.spikeActiveDuration = Math.max(this._minTimeout, this.spikeActiveDuration);
        this.spikeCooldownDuration = Math.max(this._minDelay, this.spikeCooldownDuration);
        
        let timer = this.GetComponentInChildren<Timer>();
        let animator = this.GetComponentInChildren<Animator>(true);
        
        animator.speed = this.animationSpeed;
        timer.timeout = this.spikeCooldownDuration;
        timer.interval = this.spikeCooldownDuration;
        timer.repeatCount = this.repeatCount;
        
        timer.OnCountdownEnd ??= new UnityEvent();
        timer?.OnCountdownEnd.AddListener(() => {
            this._fire = !this._fire;
            
            if (this._fire) {
                timer.timeout = this.spikeActiveDuration;
                timer.interval = this.spikeActiveDuration;
            }
            else {
                timer.timeout = this.spikeCooldownDuration;
                timer.interval = this.spikeCooldownDuration;
            }
            animator.SetBool("fire", this._fire);
        });

        // Start the animator and timer
        animator.enabled = true;
        timer?.StartTimer();
    }

}