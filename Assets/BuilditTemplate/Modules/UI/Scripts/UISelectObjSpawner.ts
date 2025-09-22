import UISelectionPopup from "./UISelectionPopup";
import { Transform, Texture2D, GameObject, Object } from "UnityEngine";
import UISelectableList from "./UISelectableList";

export default class UISelectObjSpawner extends UISelectionPopup {

    public spawnLocation: Transform;
    // public items: SpawnItem[];
    
    Awake() {
        super.Awake();
        // Fill the items
    }

    
    protected OnAction() {
        
        let object = this.selectable.selectedItem.item;
        
        let instance = Object.Instantiate(object,  this.spawnLocation.position, this.spawnLocation.rotation);
        
        super.OnAction();
    }
    
}


class SpawnItem {
    public thumbnail: Texture2D;
    public prefab: Object;
}