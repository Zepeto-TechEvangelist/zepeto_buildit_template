import UIPopup from "./UIPopup";
import UISelectableList from "./UISelectableList";
import { GameObject } from "UnityEngine";

export default class UISelectionPopup extends UIPopup {
    
    protected selectable: UISelectableList;
    
    public itemPrefab: GameObject;
    
    Awake() {
        super.Awake();
        
        this.selectable = this.content.GetComponent<UISelectableList>() ?? this.content.GetComponentInChildren<UISelectableList>();
    }
    
    
}