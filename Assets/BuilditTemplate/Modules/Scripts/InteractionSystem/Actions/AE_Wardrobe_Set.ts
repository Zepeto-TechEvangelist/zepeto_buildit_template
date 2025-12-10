import { ActionBase } from "../ActionBase";
import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import { Object, GameObject, Time } from "UnityEngine";
import { WardrobeItemKeyword } from "../../../Wardrobe/Scripts/Types";
import WardrobeController from "../../../Wardrobe/Scripts/WardrobeController";
import { ItemKeyword } from 'ZEPETO.Module.Shop';

export default class AE_Wardrobe_Set extends ActionBase {

    public target?: ZepetoCharacter;
    public duration: int = -1;

    // List of zepeto item  ids
    public itemIds: string[];

    // public category: WardrobeItemKeyword;
    private wardrobe: WardrobeController;

    // Can use Manequin component, best to check how it works in Fashion live
    
    Init() {
    }

    override DoAction(): void {
        this.target ??= ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

        // Wardrobe manager so to say
        this.wardrobe = GameObject.FindObjectOfType<WardrobeController>(true);
        
        this.wardrobe.SetCharacterItemsIds(this.itemIds);
        // Load the items once, or have a wardrobe with the functiioin

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