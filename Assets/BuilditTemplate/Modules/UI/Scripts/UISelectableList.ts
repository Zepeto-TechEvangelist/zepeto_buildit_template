import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import UIContentItem from "./UIContentItem";
import { Object } from "UnityEngine";

export default class UISelectableList extends ZepetoScriptBehaviour {
    
    private _items: UIContentItem[] = [];
    public get items(): UIContentItem[] { return this._items; }
    
    public selectedIndex: number = -1;
    public get selectedItem(): UIContentItem { return this._items[this.selectedIndex] }
    
    Start() {
        this._items = this.GetComponentsInChildren<UIContentItem>(true);

        for (let i = 0; i < this._items.length; i++) {
            let item = this._items[i];
            item.index = i;
            item.button.onClick.AddListener(() => { this.SelectItem(item) });
        }
    }
    
    AddItem(item: UIContentItem) {
        this._items.push(item);
        item.index = this._items.length - 1;
        item.button.onClick.AddListener(() => { this.SelectItem(item) });
    }
    
    Clear() {
        while (this._items.length) {
            let item = this._items.pop();   
            Object.Destroy(item.gameObject);
        }
        this._items = [];
    }
    
    SelectItem(item: UIContentItem) {
        if (this.selectedIndex != -1)
            this._items[this.selectedIndex].SetSelected(false);
        
        this.selectedIndex = item.index;
        item.SetSelected(true);
    }
    
}