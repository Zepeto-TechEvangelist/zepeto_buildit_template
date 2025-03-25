import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {Application, GameObject, SystemLanguage, WaitForEndOfFrame, WaitForSeconds} from "UnityEngine";

import ObjectGroup from './ObjectGroup';
import GroupManager from './GroupManager';
import SceneManager from './SceneManager';
import CollectableController from './CollectableController';

import {PopupCommon, PopupCommonBuilder, ZepetoToast} from 'ZEPETO.World.Gui';
import {Type} from "ZEPETO.World.Gui.ZepetoToast";
import {CurrencyType, EventAPI} from "ZEPETO.Module.Event";


export default class CollectableManager extends ZepetoScriptBehaviour {
    
    public isCollecting: boolean;

    public groupCount: number;
    
    @HideInInspector()
    public collectables: CollectableController[];
    
    @HideInInspector()
    public current: CollectableController;
    
    /* UI */
    private _popup: PopupCommon;

    /* Singleton */
    private static m_instance: CollectableManager = null;
    public static get instance(): CollectableManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<CollectableManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(CollectableManager.name).AddComponent<CollectableManager>();
            }
        }
        return this.m_instance;
    }
    
    private Awake() {
        if (CollectableManager.m_instance !== null && CollectableManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            CollectableManager.m_instance = this;
            if (this.transform.parent === null)
                GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }
    
    private Start() {
        
        // TODO: Add additional logic for collectable groups only (now only collectable groups exist)
        
        // Calculate number of possible chests in the world
        let groups: Map<string, ObjectGroup[]> = GroupManager.instance.groups;
        this.groupCount = groups.size;
        
        SceneManager.instance.OnSceneInitialized.AddListener(() => {
            this.StartCoroutine(this.ShowWelcome());
        });
        
    }

    public Collect(collectable: CollectableController): boolean {
        if (this.isCollecting) 
            return false;
        
        this.isCollecting = true;
        this.current = collectable;

        EventAPI.TryCollect((eventName: string, currencyType: CurrencyType, amount: number) =>
            {
                collectable.OnCollected(true);
                this.OnCollected(true);
            }, (errorCode, errorMsg) => {
                collectable.OnCollected(false);
                this.OnCollected(false);
            }
        );
        
        return true;
    }
    
    private OnCollected(success: boolean) {
        this.current = null;
        this.isCollecting = false;

        // this.ChestFound();
    }
    
    public *ShowWelcome() {

        if (this.groupCount < 1) 
            return;
        
        let duration = 3;

        yield new WaitForSeconds(0.5);
        
        ZepetoToast.Show(Type.None, "Searching for hidden treasure ...");
        
        yield new WaitForSeconds(duration);
        
        this.StartCoroutine(this.ShowRemaining());
    }
    
    public ChestFound() {
        this.groupCount--;
        this.StartCoroutine(this.ShowRemaining());
    }
    
    public *ShowRemaining() {
        ZepetoToast.Show(Type.None, this.GetLocalizedMessage());
    }
    
    private GetLocalizedMessage(): string {

        return this.groupCount == 0 ?
            "You found all chests!" :
            `There are ${this.groupCount} chests hidden in this world!`;
        
        switch (Application.systemLanguage) {
            case SystemLanguage.Korean:
                return this.groupCount == 0 ?
                    "You found all chests!" :
                    `There are ${this.groupCount} chests hidden in this world!`;
                break;

            case SystemLanguage.Japanese:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
            case SystemLanguage.Chinese:
            case SystemLanguage.ChineseSimplified:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
            case SystemLanguage.Thai:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
            case SystemLanguage.Indonesian:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
            case SystemLanguage.French:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
            case SystemLanguage.English:
            default:
                return `There are ${this.groupCount} chests hidden in this world!`;
                break;
        }
    }
    
}