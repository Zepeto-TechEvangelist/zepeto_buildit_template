import { ActionBase } from "../ActionBase";
import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import { AnimationClip, Time } from "UnityEngine";

export default class AE_Character_Gesture extends ActionBase {

    public target?: ZepetoCharacter;
    public gestureName: string;
    
    public gesture: AnimationClip;
    public duration: int = -1;
    public isInterruptable: bool = true;
    
    Init() {
    }

    override DoAction(): void {
        this.target ??= ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

        // Play gesture on the caharcter
        this.target.ZepetoAnimator.speed = 1;
        this.target.SetGesture(this.gesture);
        this.StartCoroutine( this.WaitForExit(this.target, this.isInterruptable, this.duration) );
    }

    // TODO: Gesture player class
    private *WaitForExit(character: ZepetoCharacter, interruptable: bool = true, timeout: float = -1)
    {
        if (!character) 
            return;
        
        var hasTimeout: bool = timeout > 0 ? true : false;
        
        console.log(`AE_Gesture [interrupt]${interruptable} [timeout]${hasTimeout}:${timeout}`);
        
        // Waiting for action loop
        while (true) {
            
            // Input interrupt
            if (interruptable && (character.tryJump || character.tryMove))
                break;
            
            // Timeout interrupt
            if (hasTimeout) {
                timeout -= Time.deltaTime;
                if (timeout <= 0)
                    break;
            }
            
            yield;
        }
        
        character.CancelGesture();
    }
}
