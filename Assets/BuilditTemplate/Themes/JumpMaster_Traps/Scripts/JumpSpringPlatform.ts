import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {Collider, Time, Vector3, ParticleSystem } from "UnityEngine";
import {CharacterMoveState, ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType } from '../../../Modules/Scripts/PlayerTrigger';
// import { P } from 'UnityEngine.ParticleSystem';

export default class JumpSpringPlatform extends ZepetoScriptBehaviour implements PlayerTriggerInterface {
    
    @Tooltip("Jump acceleration when the spring is activated")
    public jumpPower: number = 4;

    @Tooltip("Delay before spring is automatically activated")
    public delayJumpTimer: number = 1.5;
   
    private _particleEffect: ParticleSystem;
    
    private _isTrrggerBool: boolean = false;
    private _minJumpPower: number = 4;
    
    private _currentDelayTimer: number = 0;
    private _jumpTimer: number = 0.4;
    private _jumpBool: boolean = true;
    private _savedJumpPower: float
   
    private _particleTimer: float;
    
    Start() {
        this.GetComponentInChildren<PlayerTrigger>().delegate = this;
        this._particleEffect = this.GetComponentInChildren<ParticleSystem>();
        this._particleEffect.Stop();    // Stop at start
        // this._particleEffect.loop = false;
    }
    
    Update()
    {
        if (this._isTrrggerBool)
        {
            var player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
            
            if (this._currentDelayTimer <= this.delayJumpTimer)
            {
                this._currentDelayTimer += Time.deltaTime;
            }
            else
            {
                if (this._jumpTimer > 0)
                {
                    this._jumpTimer -= Time.deltaTime;
                    if (this._jumpBool)
                    {
                        this._particleEffect.Play();
                        this._particleTimer = this._particleEffect.duration;    
                        player.character.Jump();
                        
                        // player.character. Move(Vector3.op_Multiply(Vector3.forward, 0.5));
                        this._jumpBool = false;
                    }
                }
                else {
                    this._isTrrggerBool = false;
                    this._jumpBool = true;
                    this._jumpTimer = 0.4;
                    this._currentDelayTimer = 0;
                    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.additionalJumpPower = this._savedJumpPower;
                }
            }
            
            if (this._particleTimer > 0) {
                this._particleTimer -= Time.deltaTime;
                if (this._particleTimer < 0)
                    this._particleEffect.Stop();
            }
        }
        else if (this._isTrrggerBool == false && this._currentDelayTimer > 0)
        {
            this._currentDelayTimer = 0;
        }
    }



    OnPlayerEnter(character: ZepetoCharacter, type: ZepetoCharacterType) {
        // Intentionally left blank
    }
    OnPlayerStay(character: ZepetoCharacter, type: ZepetoCharacterType) {
        if (this._isTrrggerBool == false ) {
            this._isTrrggerBool = true;
            if (this.jumpPower < this._minJumpPower)
            {
                this.jumpPower = this._minJumpPower;
            }

            this._savedJumpPower = character.additionalJumpPower;
            character.additionalJumpPower += this.jumpPower;
        }
    }
    OnPlayerExit(character: ZepetoCharacter, type: ZepetoCharacterType) {
        this._isTrrggerBool = false;
        character.additionalJumpPower = this._savedJumpPower;
        // this._particleEffect.Stop();
    }
    
    

}