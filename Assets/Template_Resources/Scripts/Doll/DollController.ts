import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {AnimationClip, Animator, AudioSource, GameObject, Quaternion} from 'UnityEngine';

import RandomTimeoutScheduler from './RandomTimeoutScheduler';
import SceneManager from './../../Modules/Scripts/SceneManager';
import {Player} from "ZEPETO.Multiplay.Schema";

import {CharacterState, KnowSockets, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import ZepetoPlayersManager from '../../../Zepeto Multiplay Component/ZepetoScript/Player/ZepetoPlayersManager';
import TransformInterpolation from './TransformInterpolation';


enum DollState {
    Idle = -1,
    Counting,
    Turning,
    Looking,
    Returning,
    Finished
}

export default class DollController extends ZepetoScriptBehaviour {

    @Header("Configuration")
    
    @Tooltip("The minimum round counting time")
    public minCountingTime: float;
    @Tooltip("Maximum counting round counting time")
    public maxCountingTime: float;
    
    
    @Header("Connected components")
    
    @Tooltip("Animation played when a player is killed") 
    public deathAnimation: AnimationClip;
    @Tooltip("Laser")
    public laserPrefab: GameObject;
    @Tooltip("Main animator component") 
    public animator: Animator;
    @Tooltip("Main audio source") 
    public audio: AudioSource;

    public state: int;
    
    private _state: DollState = DollState.Idle;
    private _timer: RandomTimeoutScheduler;
    private _currentPlayers: string[] = [];
    private _deadPlayers: string[];
    private _playerControls: GameObject = null;
    
    
    Start() {    

        // References
        this._timer = this.GetComponent<RandomTimeoutScheduler>();
        this._timer.min = this.minCountingTime;
        this._timer.max = this.maxCountingTime;
        
        this._playerControls = GameObject.Find("UIZepetoPlayerControl");

        // Callbacks
        this._timer.OnFinished.AddListener(() => {
            
        });
        this._timer.OnTimer.AddListener(() => {
            this.NextState();
        });
        
        // Synchronizer
        SceneManager.instance.OnSceneInitialized?.AddListener(() => {

            this._playerControls = GameObject.Find("UIZepetoPlayerControl");
            
            this.UpdateState();
            // this._timer.Schedule(1.0);
        });
        
    }
    
    public Initialize() {
        
    }
    
    public NextState() {
        this._state = (this._state + 1) % (DollState.Finished);
        this.state = this._state;
        
        this.UpdateState();
    }

    public UpdateState() {

        this.animator.SetInteger('state', this._state);

        
        switch (this._state) {
            case DollState.Idle:
                this.ResetPlayerState();
                this._timer.Schedule(1.18);
                break;

            case DollState.Counting:
                
                // let pitch = (this.audio.clip.length / this._timer.interval);
                // this.audio.pitch = pitch;
                this.audio.PlayDelayed(0.0);   // Delay to match the animation transition
                this._timer.ScheduleRandom();
                break;

            case DollState.Turning:
                // this.audio.Stop();
                this._timer.Schedule(0.6);
                break;

            case DollState.Looking:
                this.audio.Stop();
                this.SavePlayersState();
                this._timer.ScheduleRandom();
                break;

            case DollState.Returning:
                this._timer.Schedule(0.3);
                break;

            case DollState.Finished:
                this._timer.Pause();
                break;
        }
    }
    
    private Update() {
        
        if (this._state != DollState.Looking)
            return;

        this._currentPlayers.forEach((playerId: string, index) => {
            
            if (!this._deadPlayers.find(id => id === playerId) && ZepetoPlayers.instance.HasPlayer(playerId)) {
                
                let zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerId);
                if (zepetoPlayer.character.CurrentState != CharacterState.Idle) {

                    let playerLocation = zepetoPlayer.character.transform.position;
                    let position = this.laserPrefab.transform.position;
                    let laserRotation = Quaternion.LookRotation(playerLocation);
                    
                    // Shoot laser
                    var laser = GameObject.Instantiate(this.laserPrefab, position, laserRotation) as GameObject;
                    let moveTo = laser.GetComponent<TransformInterpolation>();
                    moveTo.target = zepetoPlayer.character.GetSocket(KnowSockets.HEAD_UPPER).transform;
                    laser.SetActive(true);
                    
                    this._deadPlayers.push(playerId);
                    zepetoPlayer.character.SetGesture(this.deathAnimation);
                    // zepetoPlayer.character.characterController.enabled = false;
                    
                    // Died self
                    if (zepetoPlayer.isLocalPlayer)
                        this._playerControls?.SetActive(false);
                }
            }
        });
    }
    
    private ResetPlayerState() {

        this._deadPlayers = [];
        this._currentPlayers = [];
        this._playerControls?.SetActive(true);
        
        // this._currentPlayers.forEach((playerId: string, index) => {
        //
        //     if (ZepetoPlayers.instance.HasPlayer(playerId)) {
        //
        //         let zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerId);
        //         zepetoPlayer.character.characterController.enabled = true;
        //     }
        // });
    }
    
    private SavePlayersState() {

        this._deadPlayers = [];
        this._currentPlayers = [];
        
        
        ZepetoPlayersManager.instance.currentPlayers.forEach((player: Player)=>{
            this._currentPlayers.push(player.sessionId);
        });
        
        // console.log('Saved Player State' + this._currentPlayers.length);
    }
    
    private CheckGameEnd() {
        if (this._currentPlayers.length == this._deadPlayers.length) {
            this._state = DollState.Finished;
        }
    }

    
    // maybe interface for all players state / game state
}