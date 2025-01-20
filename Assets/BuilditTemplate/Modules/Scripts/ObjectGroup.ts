import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ObjectGroup extends ZepetoScriptBehaviour {
    
    @Tooltip("The id of the group")
    public groupId: string;
    
    @HideInInspector() public static groups: Map<string, ObjectGroup[]> = new Map<string, ObjectGroup[]>();
    
    public get members(): [ObjectGroup] { 
        return ObjectGroup.groups[this.groupId];
    };
    
    Awake() 
    {
        if (ObjectGroup.groups[this.groupId] === undefined)
            ObjectGroup.groups[this.groupId] = [];
        
        ObjectGroup.groups[this.groupId].push(this);
    }
    
}