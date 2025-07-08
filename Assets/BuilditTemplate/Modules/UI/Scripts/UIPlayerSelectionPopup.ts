import UISelectionPopup from "./UISelectionPopup";
import { Transform, Texture2D, GameObject, Object } from "UnityEngine";
import UISelectableList from "./UISelectableList";
import { ZepetoPlayers, ZepetoPlayer, ZepetoCharacter } from "ZEPETO.Character.Controller" 
import ZepetoPlayersManager from "../../../../Zepeto Multiplay Component/ZepetoScript/Player/ZepetoPlayersManager";
import {State, Player} from "ZEPETO.Multiplay.Schema";
import UIContentItem from "./UIContentItem";
import { ZepetoText } from "ZEPETO.World.Gui";

export default class UIPlayerSelectionPopup extends UISelectionPopup {

    Show() {
        super.Show();
        
        this.Reload();      
    }

    public Reload() {

        this.selectable.Clear();
        
        const players: Map<string, Player> = ZepetoPlayersManager.instance.currentPlayers;
        
        players.forEach((player: Player) => {

            if (ZepetoPlayers.instance.HasPlayer(player.sessionId)) {
                let zPlayer = ZepetoPlayers.instance.GetPlayer(player.sessionId);
                if (zPlayer.isLocalPlayer) {
                    return;
                }

                let payload = new Payload();
                payload.player = zPlayer;
                payload.title = zPlayer.name;
                payload.id = player.sessionId;
                

                let item = GameObject.Instantiate(this.itemPrefab, this.selectable.transform) as GameObject;
                
                let contentItem = item.GetComponent<UIContentItem>();
                contentItem.item = payload;
                item.GetComponentInChildren<ZepetoText>().text = payload.title;
                
                item.SetActive(true);
                this.selectable.AddItem( contentItem );
            }
        });
        
        // Empty list
        if (this.selectable.items.length == 0) {
            this.message.text = "There are no other players in the room to teleport to";
            this.actionButton.gameObject.SetActive(false);
            this.cancelButton.gameObject.SetActive(true);
        }
        else {
            this.message.text = "Select a player to teleport to";
            this.actionButton.gameObject.SetActive(true);
            this.cancelButton.gameObject.SetActive(false);
        }
        
    }
    
    protected OnAction() {
        
        let payload = this.selectable.selectedItem.item as Payload;
        
        if (!payload ||
            ! payload.player ||
            // || (ZepetoPlayers.instance.HasPlayer(payload.id) == false) 
            ! payload.player.character) {
            
            return;
        }
        
        let target = payload.player.character.transform;
        let localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        
        localCharacter.Teleport(target.position, target.rotation);
        
        super.OnAction();
    }

}

class Payload extends Object {
    public title: string;
    public id: string;
    public player: ZepetoPlayer;
}