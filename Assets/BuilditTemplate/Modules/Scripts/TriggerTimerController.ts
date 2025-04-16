import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {Vector3, Time, WaitForSeconds, Coroutine, Collider} from 'UnityEngine';
import Timer, {TimerInterface} from './Timer';
import PlayerTrigger, {PlayerTriggerInterface, ZepetoCharacterType} from './PlayerTrigger';
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { TextMeshPro } from 'TMPro';
import { UnityEvent } from 'UnityEngine.Events';


export default class TriggerTimerController extends ZepetoScriptBehaviour implements PlayerTriggerInterface, TimerInterface{
    
    public timerDisplay: TextMeshPro;
    public activator: UnityEvent;
    
    private _playerTrigger: PlayerTrigger;
    private _timer: Timer;
    private _triggerActivated: boolean = false;
    
    
    public get playerTrigger(): PlayerTrigger { return this._playerTrigger; }
    
    public get timer(): Timer { return this._timer; }
    
    Awake() {
        this._playerTrigger = this.GetComponent<PlayerTrigger>();
        this._timer = this.GetComponent<Timer>();
        
        this._playerTrigger.delegate = this;
        this._timer.delegate = this;
    }
    
    OnPlayerEnter(character: ZepetoCharacter, type: ZepetoCharacterType) {
        this._timer.StartTimer();
    }
    
    OnPlayerStay(character: ZepetoCharacter, type: ZepetoCharacterType) {}
        
    
    
    OnPlayerExit(character: ZepetoCharacter, type: ZepetoCharacterType) {
    }
    
    OnCountdownStart() {
        // this.timerDisplay.gameObject.SetActive(true);
    }
    
    OnStep() {
        this.timerDisplay.text = `${Math.ceil(this._timer.remainingTime)}`;
    }
    
    OnCoundownEnd() {
        this.timerDisplay.gameObject.SetActive(false);
        this._triggerActivated = true;
        this.activator?.Invoke();
    }
}