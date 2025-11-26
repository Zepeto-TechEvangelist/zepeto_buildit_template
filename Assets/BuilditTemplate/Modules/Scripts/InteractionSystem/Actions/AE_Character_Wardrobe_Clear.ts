import { ActionBase } from "../ActionBase";
import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import { Object, GameObject, Time } from "UnityEngine";
import { WardrobeItemKeyword } from "../../../Wardrobe/Scripts/Types";
import WardrobeController from "../../../Wardrobe/Scripts/WardrobeController";
import { ItemKeyword } from 'ZEPETO.Module.Shop';

export default class AE_Character_Wardrobe_Clear extends ActionBase {

    public target?: ZepetoCharacter;
    public category: WardrobeItemKeyword;
    public duration: int = -1;

    private wardrobe: WardrobeController;
    
    Init() {
    }

    override DoAction(): void {
        this.target ??= ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        
        // Wardrobe manager so to say
        this.wardrobe = GameObject.FindObjectOfType<WardrobeController>(true);
        this.wardrobe.ClearCharacterItem(this.category, () => {});
        
        this.StartCoroutine(this.DelayReset(this.target, this.duration));
    }

    private *DelayReset(character: ZepetoCharacter, timeout: float = -1)
    {
        if (!character)
            return;

        var hasTimeout: bool = timeout > 0 ? true : false;

        // Waiting for action loop
        while (true) {
            
            // Timeout interrupt
            if (hasTimeout) {
                timeout -= Time.deltaTime;
                if (timeout <= 0)
                    break;
            }

            yield;
        }
        
        this.wardrobe.ResetCharacterItems();
    }
}