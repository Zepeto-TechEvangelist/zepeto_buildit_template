import { Animator } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Timer from '../../../Modules/Scripts/Timer';
import { UnityEvent } from 'UnityEngine.Events';

export default class SpikeTrap extends ZepetoScriptBehaviour {
    
    public timeout: float;
    public speed: float;
    private _minSpeed = 0.1;
    // Settings
    private _open: boolean;
    
    Start() {    
        let timer = this.GetComponentInChildren<Timer>();
        let animator = this.GetComponentInChildren<Animator>();

        this.speed = Math.max(this._minSpeed, this.speed);
        animator.speed = this.speed;
        timer.timeout = this.timeout;
        timer.interval = this.timeout;
        
        timer?.StartTimer();
        
        timer.OnCountdownEnd = new UnityEvent();
        
        timer?.OnCountdownEnd.AddListener(() => {
            this._open != this._open;
            // if (this._open) 
                animator.SetTrigger("open");
            // else
            //     animator.ResetTrigger("open");
        });
    }

}