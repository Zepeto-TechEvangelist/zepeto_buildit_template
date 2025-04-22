import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {Transform, Vector3, Time, Collider, WaitForSeconds, Coroutine, GameObject, ParticleSystem} from 'UnityEngine';
import TrapManager from './TrapManager';
import { Button } from "UnityEngine.UI";
import TriggerTimerController from '../../../Modules/Scripts/TriggerTimerController';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType} from '../../../Modules/Scripts/PlayerTrigger';
import Explosion from '../../../Modules/Scripts/Effects/Explosion';
import ContactTrap from './ContactTrap';
import { UnityEvent } from 'UnityEngine.Events';
import ShakeAnimation from '../../../Modules/Scripts/Effects/ShakeAnimation';

export default class BombTrap extends ZepetoScriptBehaviour {
    
    @Header("Settings")
    public fuseDuration: number;
    @HideInInspector() public explosionSpeed: number = 0.2;
    public explosionRange: number;
    public showTimer: boolean;
    
    
    // First trigger that activates the trap
    private _proximityTrigger: TriggerTimerController;
    
    
    // private _explosionTrigger: PlayerTrigger;
    private _explosion: Explosion;
    private _contactTrap: ContactTrap;
    private _contactTrap_Obj: GameObject;
    
    // Fuse
    private _sparkEffect: ParticleSystem;
    private _shakeAnimation: ShakeAnimation;

    
    Awake() {
        TrapManager.instance;   // Autogenerate if missing
    }
    
    Start() {
        
        // Configure Fuse
        this._proximityTrigger = this.GetComponentInChildren<TriggerTimerController>(true);
        this._sparkEffect = this._proximityTrigger.GetComponentInChildren<ParticleSystem>(true);
        this._shakeAnimation = this._proximityTrigger.GetComponentInChildren<ShakeAnimation>(true);
        
        
        var startFuse = new UnityEvent();
        startFuse.AddListener(() => { 
            this._sparkEffect.gameObject.SetActive(true);
            this._shakeAnimation.enabled = true;
        });
        this._proximityTrigger.timer.OnCountdownStart = startFuse;
        this._contactTrap_Obj = this.transform.Find("ContactTrap").gameObject;
        this._explosion = this._contactTrap_Obj.AddComponent<Explosion>();


        // Apply properties
        this._proximityTrigger.timer.timeout = this.fuseDuration;
        this._explosion.duration = this.explosionSpeed;
        this._explosion.size = this.explosionRange;
        this._shakeAnimation.time = this.fuseDuration;
        this._shakeAnimation.intervalCurve = -this._shakeAnimation.interval / this.fuseDuration;
        if (this.showTimer == false) {
            this._proximityTrigger.timerDisplay.gameObject.SetActive(false);
        }
        
        
        // Apply logic
        this._proximityTrigger.activator.AddListener(() => {
            
            this._contactTrap_Obj.SetActive(true);
            this._proximityTrigger.gameObject.SetActive(false);
        });
    }
}