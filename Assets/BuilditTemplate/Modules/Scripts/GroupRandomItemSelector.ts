import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ObjectGroup from './ObjectGroup';

export default class GroupRandomItemSelector extends ZepetoScriptBehaviour {
    
    private _group: ObjectGroup;
    
    Awake() {
        this._group = this.GetComponent<ObjectGroup>();
    }
    
    
    // TODO: Add selection function later
}