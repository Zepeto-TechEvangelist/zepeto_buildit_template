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

        EventAPI.TryCollect((eventName: string, currencyType: CurrencyType, amount: number) => {
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
    }

    public* ShowWelcome() {

        if (this.groupCount < 1)
            return;

        const duration = 3;

        yield new WaitForSeconds(0.5);

        ZepetoToast.Show(Type.None, this.GetLocalizedMessage(ToastMessages.Searching));

        yield new WaitForSeconds(duration);

        ZepetoToast.Show(Type.None, this.GetLocalizedMessage(ToastMessages.Welcome));

        yield new WaitForSeconds(duration);

        ZepetoToast.Show(Type.None, this.GetLocalizedMessage(ToastMessages.EventDesc));
    }

    public ChestFound() {
        this.groupCount--;
        this.StartCoroutine(this.ShowRemaining());
    }

    public* ShowRemaining() {
        ZepetoToast.Show(Type.None, this.GetLocalizedMessage( this.groupCount == 0 ?  ToastMessages.Finished : ToastMessages.RemainingCount));
    }

    private LanguageStringKey(): string {
        switch (Application.systemLanguage) {
            case SystemLanguage.Korean:
                return "ko";
            case SystemLanguage.Japanese:
                return "jp";
            case SystemLanguage.Chinese:
            case SystemLanguage.ChineseSimplified:
                return "cn";
            case SystemLanguage.Thai:
                return "th";
            case SystemLanguage.Indonesian:
                return "id";
            case SystemLanguage.French:
                return "fr";
            case SystemLanguage.English:
            default:
                return "en";
        }
    }
    
    private GetLocalizedMessage(type: ToastMessages): string {
        let str: string = ToastStrings[this.LanguageStringKey()][type];
        return str.replace("{0}", `${this.groupCount}`);
    }
}

enum ToastMessages {
    Searching = 0,
    Welcome,
    EventDesc,
    RemainingCount,
    Finished
};

const ToastStrings/* = (str: string) =>*/= {
    "ko": [
        "이 월드에 있는 보물 상자를 검색 중입니다..",
        "이 월드에는 {0}개의 보물 상자가 있습니다!", 
        "이벤트 기간이라면 보물상자를 찾을 수 있을거에요.",
        "이 월드에는 이제 {0}개의 보물 상자가 남았습니다.",
        "당신은 모든 보물 상자를 다 찾았습니다!"
    ],
    "en": [
        "Searching for treasure chests in this World...",
        "There are {0} treasure chests in this World!", 
        "If it's during the event period, you might be able to find some.",
        "There are now {0} treasure chests left in this World.",
        "You have found all the treasure chests!"],

    "jp": [
        "このWorldで宝箱を検索中です…",
        "このWorldには宝箱が{0}個あります！",
        "イベント期間中なら見つけられるかもしれません。",
        "このWorldには残り{0}個の宝箱があります。",
        "すべての宝箱を見つけました！"
    ],
    "cn": [
        "正在搜索这个World中的宝箱……",
        "这个World中有{0}个宝箱！",
        "如果在活动期间，可能可以找到宝箱。",
        "这个World中现在还剩下{0}个宝箱。",
        "你已经找到了所有的宝箱！"
    ],

    "th": [
        "กำลังค้นหาหีบสมบัติใน World นี้...",
        "ใน World นี้มีหีบสมบัติ {0} กล่อง!", 
        "หากเป็นช่วงกิจกรรม คุณอาจจะพบหีบสมบัติได้",
        "ตอนนี้ใน World นี้เหลือหีบสมบัติ {0} กล่อง",
        "คุณพบหีบสมบัติทั้งหมดแล้ว!"
    ],
    "id": [
        "Sedang mencari peti harta karun di World ini...",
        "Ada {0} peti harta karun di World ini!", 
        "Jika sedang dalam periode event, kamu mungkin bisa menemukannya.",
        "Sekarang ada {0} peti harta karun tersisa di World ini.",
        "Kamu telah menemukan semua peti harta karun!"
    ],
    "fr": [

        "Recherche de coffres au trésor dans ce World...",
        "Il y a {0} coffre au trésor dans ce World !", 
        "S'il y a un événement en cours, vous pourriez en trouver.",
        "Il reste maintenant {0} coffre au trésor dans ce World.",
        "Vous avez trouvé tous les coffres au trésor !"
    ]
}