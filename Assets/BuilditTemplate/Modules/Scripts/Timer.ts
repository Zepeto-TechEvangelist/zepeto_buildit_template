import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Vector3, Time, WaitForSeconds, Coroutine} from 'UnityEngine';
import { UnityEvent } from 'UnityEngine.Events';

export interface TimerInterface {
    OnCountdownStart();
    OnStep();
    OnCoundownEnd();
}

export default class Timer extends ZepetoScriptBehaviour {

    public automaticallyStart: boolean;
    
    @Tooltip("Timeout in seconds")
    // Timeout in seconds
    public timeout: number;

    @Tooltip("Does the timer repeat multiple times")
    // Number of times the timer should repeat (-1 for infinite)
    public repeatCount: number = 1;

    // Step interval in seconds
    public interval: number = 0.5;

    // Delegate receiving callbacks
    @HideInInspector() public delegate: TimerInterface;
    
    
    public get elapsedTime(): number { return this._elapsedTime };
    
    public get remainingTime(): number { return this.timeout - this._elapsedTime };
    
    public get countdownActive(): boolean { return this._countdownActive };
    
    
    Start() {
        
        if (this.interval == 0)
            this.interval = this.timeout;
        
        if (this.automaticallyStart)
            this.StartTimer();
    }
    
    public StartTimer() {
        this.StartCountdown();
    }
    public PauseTimer() {
        this._countdownActive = false;
    }
    public EndTimer() {
        this.EndCountdown();
    }
    
    
    // Interface -------------------------------------------------------//

    public OnCountdownStart: UnityEvent;

    public OnStep: UnityEvent;

    public OnCountdownEnd: UnityEvent;
    
    // Countdown ----------------------------------------------------- //

    /** Tag representing if the timer is counting down */
    protected _countdownActive: boolean = false;

    // Time elapsed since starting the timer
    protected _elapsedTime: number = 0;

    // The timer
    protected _stepper: Coroutine;


    protected StartCountdown() {

        if (this._countdownActive || this.repeatCount == 0)
            return;
        
        this._countdownActive = true;

        this.delegate?.OnCountdownStart();
        this.OnCountdownStart?.Invoke();

        if (this._stepper) {
            return;
        }
        this._stepper = this.StartCoroutine(this.Step());
    }

    protected *Step() {
        while (this._countdownActive && this._elapsedTime < this.timeout) {

            this.delegate?.OnStep();
            this.OnStep?.Invoke();

            yield new WaitForSeconds(this.interval);
            this._elapsedTime += this.interval;
        }

        if (this._elapsedTime >= this.timeout)
            this.EndCountdown();
    }

    protected EndCountdown() {
        if (this._stepper) {
            this.StopCoroutine(this._stepper);
            this._stepper = null;
        }
        
        this._countdownActive = false;
        this.repeatCount -= 1;

        this.delegate?.OnCoundownEnd();
        this.OnCountdownEnd?.Invoke();
        
        this._elapsedTime = 0;
        this.StartCountdown();  // repeat
    }

    // --------------------------------------------------------------- //
    
}