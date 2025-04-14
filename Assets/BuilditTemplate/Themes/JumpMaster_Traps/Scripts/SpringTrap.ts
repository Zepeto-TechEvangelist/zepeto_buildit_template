import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {Collider, Time, Vector3} from "UnityEngine";
import {CharacterMoveState, ZepetoPlayers} from 'ZEPETO.Character.Controller';

export default class SpringTrap extends ZepetoScriptBehaviour {
    
    @Tooltip("Jump acceleration when the spring is activated")
    public SpringJumpPower: number = 4;

    
    
    private _isTrrggerBool: boolean = false;
    private _minJumpPower: number = 4;
    private _delayJumpTimer: number = 1.5;
    private _currentDelayTimer: number = 0;
    private _jumpTimer: number = 0.4;
    private _jumpBool: boolean = true;
    private _savedJumpPower: float
   
    Update()
    {
        
        
        if (this._isTrrggerBool)
        {
            var player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
            
            if (this._currentDelayTimer <= this._delayJumpTimer)
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
                        player.character.Jump();
                        // player.character. Move(Vector3.op_Multiply(Vector3.forward, 0.5));
                        this._jumpBool = false;
                        // if (ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.motionState.currentMoveState != CharacterMoveState.None)
                        // {
                        //     // NewWorldBase.multiplay.localCharacter.animator.SetTrigger("Jump");
                        //     // player.character.Jump();// Jump();
                        //     player.character.ZepetoAnimator.SetTrigger("Jump");
                        // }
                        // else
                        // {
                        //     // NewWorldBase.multiplay.localCharacter.animator.SetTrigger("Jump_Idle");
                        //     player.character.ZepetoAnimator.SetTrigger("Jump_Idle");
                        // }
                        //
                    }
                    // player.character.Move(Vector3.op_Multiply(Vector3.forward, 0.02));
                }
                else {
                    this._isTrrggerBool = false;
                    this._jumpBool = true;
                    this._jumpTimer = 0.4;
                    this._currentDelayTimer = 0;
                    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.additionalJumpPower = this._savedJumpPower;
                }
                //     if (NewWorldBase.multiplay.JumpItemBool && NewWorldBase.multiplay.SkateboardingBool)
                //     {
                //         NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
                //         ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[1].property)
                //         ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[6].property)
                //     }
                //     else if (NewWorldBase.multiplay.SkateboardingBool)
                //     {
                //         NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
                //         ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[6].property)
                //     }
                //     else if (NewWorldBase.multiplay.JumpItemBool)
                //     {
                //         NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
                //         ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[1].property)
                //     }
                // }
            }
        }
        else if (this._isTrrggerBool == false && this._currentDelayTimer > 0)
        {
            this._currentDelayTimer = 0;
        }
    }
    // 角色触发增加角色跳跃
    OnTriggerStay(collider: Collider) {
        if (this._isTrrggerBool == false ) {
            this._isTrrggerBool = true;
            if (this.SpringJumpPower < this._minJumpPower)
            {
                this.SpringJumpPower = this._minJumpPower;
            }

            this._savedJumpPower = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.additionalJumpPower;
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.additionalJumpPower += this.SpringJumpPower;
        }
    }

    OnTriggerExit(collider: Collider) {
            this._isTrrggerBool = false;
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.additionalJumpPower = this._savedJumpPower;
            // if (NewWorldBase.multiplay.JumpItemBool && NewWorldBase.multiplay.SkateboardingBool)
            // {
            //     NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
            //     ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[1].property)
            //     ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[6].property)
            // }
            // else if (NewWorldBase.multiplay.SkateboardingBool)
            // {
            //     NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
            //     ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[6].property)
            // }
            // else if (NewWorldBase.multiplay.JumpItemBool)
            // {
            //     NewWorldBase.multiplay.localCharacter.moveComponent.SetJumpPower(ShopManager.Instance.initJumpPower);
            //     ShopManager.Instance.AddCurrentPlayerProperty(NewWorldBase.multiplay.localCharacter.userId, 0, 0, ShopManager.Instance.ShopItemList[1].property)
            // }
        
    }

}