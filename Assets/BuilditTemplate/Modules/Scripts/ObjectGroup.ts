import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GroupManager from './GroupManager';

export default class ObjectGroup extends ZepetoScriptBehaviour {
    
    @Tooltip("The id of the group")
    public groupId: string;
    
    public get members(): [ObjectGroup] { 
        return GroupManager.instance.GetMembers(this.groupId);
    };
    
    Awake() 
    {
        GroupManager.instance.AddGroup(this);
    }
    
}