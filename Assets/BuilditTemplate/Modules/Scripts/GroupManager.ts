import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ObjectGroup from './ObjectGroup';

export default class GroupManager extends ZepetoScriptBehaviour {
    
    @HideInInspector()
    public groups: Map<string, ObjectGroup[]> = new Map<string, ObjectGroup[]>();
    
    public GetMembers(id: string): [ObjectGroup] {
        return this.groups[id];
    };

    
    /* Singleton */
    private static m_instance: GroupManager = null;
    public static get instance(): GroupManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<GroupManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(GroupManager.name).AddComponent<GroupManager>();
            }
        }
        return this.m_instance;
    }
    private Awake() {
        if (GroupManager.m_instance !== null && GroupManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            GroupManager.m_instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }
    
    public Start() {
        
        console.log("Will make random selections " + this.groups.size);
        
        this.groups.forEach((members, groupId) => {
            console.log(`>> ${groupId} count ${members.length}`);
            this.MakeGroupSelection(groupId, members);
        });
        
    }
    
    public AddGroup(group: ObjectGroup) {

        console.log(`Add Group ${group.groupId}`);
        
        if (this.groups.has(group.groupId) == false)
            this.groups.set(group.groupId, []);
        
        this.groups.get(group.groupId).push(group);
    }
    
    public MakeGroupSelection(groupId: string, members :ObjectGroup[])
    {
        let index = Math.round((Math.random() * members.length - 0.5));
        console.log(`GroupSelection ${groupId} index  ${index}`);
        members.forEach((x, i) => x.gameObject.SetActive(i === index))
    }

}