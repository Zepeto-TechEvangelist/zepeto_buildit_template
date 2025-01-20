import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ObjectGroup from './ObjectGroup';

export default class GroupRandomItemSelector extends ZepetoScriptBehaviour {
    
    private _group: ObjectGroup;
    private static _selectedIndex :int = -1;
    
    Awake() {
        this._group = this.GetComponent<ObjectGroup>();
    }
    
    Start() {
        if (GroupRandomItemSelector._selectedIndex == -1)
            GroupRandomItemSelector._selectedIndex = Math.round((Math.random() * this._group.members.length));
        
        this.gameObject.SetActive(this._group.members[GroupRandomItemSelector._selectedIndex] == this._group);
    }
}