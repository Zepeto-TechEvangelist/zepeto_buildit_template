import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractionIcon from './../Interaction/ZepetoScript/InteractionIcon';
import {Application, GameObject, SystemLanguage, Transform, WaitForEndOfFrame, WaitForSeconds} from "UnityEngine";

import { EventAPI, CurrencyType, CurrencyEventCollectableObject } from 'ZEPETO.Module.Event';
import Chest from './Chest';
import {PopupCommon, PopupCommonBuilder} from 'ZEPETO.World.Gui';


export default class CollectableManager extends ZepetoScriptBehaviour {
    
    public sparkle: GameObject;
    public chest: GameObject;
    
    private button: InteractionIcon;
    private static _isCollecting: boolean = false;
    private _isCollected: boolean = false;
    private _chest: Chest;
    
    private collectable: CurrencyEventCollectableObject;
    
    private static activeManager: CollectableManager;
    
    private popup: PopupCommon;
    
    private Start() {
        
        this.button = this.GetComponent<InteractionIcon>();
        this.collectable = this.GetComponent<CurrencyEventCollectableObject>();
        this._chest = this.chest.GetComponent<Chest>();
        
        this.button.OnClickEvent.AddListener(() => {
            this.Collect();
        });
        
    }

    private Collect() {
        if (CollectableManager._isCollecting || this._isCollected) return;
        
        CollectableManager._isCollecting = true;
        this.button.HideIcon();
        this.button.enabled = false;
        
        EventAPI.TryCollect((eventName: string, currencyType: CurrencyType, amount: number) => 
            {
                this._isCollected = true;
                CollectableManager._isCollecting = false;
                
                this.StartCoroutine(this.OnEventSuccess());
            }, (errorCode, errorMsg) => {

                CollectableManager._isCollecting = false;
            
                // if (errorCode == 0) {
                //     // Set disabled
                    this._chest.Open(true);
                    this.sparkle.SetActive(false);
                    this.chest.GetComponent<Chest>()?.gold.gameObject.SetActive(false);
                    return;
                //    
                //     this.StartCoroutine(this.RemovePopup());
                //     return;
                // }
                
                this._isCollected = false;
                CollectableManager._isCollecting = false;
                this.button.enabled = true;
            }
        );
    }
    
    private * OnEventSuccess() {
        yield new WaitForEndOfFrame();

        this._chest.Open(true);
        
        yield new WaitForSeconds(1);
        
        this.sparkle.SetActive(false);
    }
    
    
    // Temporary override
    private * RemovePopup() {

        var ittr = 10;
        
        var pop: GameObject = null;
        while ((pop = GameObject.Find("PopupCommon(Clone)")) == null && ittr > 0) {
            ittr--;
            yield new WaitForEndOfFrame();
        }
        
        let popup:PopupCommon = pop.GetComponent<PopupCommon>();
        
        let builder = new PopupCommonBuilder();
        builder.SetBody(this.GetLocalizedMessage());
        builder.SetOneButton("OK", () => { popup?.Close(null); });
        popup.Initialize(builder);
    }


    // 
    private GetLocalizedMessage(): string {

        switch (Application.systemLanguage) {
            case SystemLanguage.Korean:
                return "이미 이벤트 보상을 최대 수량 만큼 획득하였네요!";
                break;

            case SystemLanguage.Japanese:
                return "おめでとうございます！すでにイベントの報酬を最大数まで獲得していますね！";
                break;
            case SystemLanguage.Chinese:
            case SystemLanguage.ChineseSimplified:
                return "你已经获得了活动中可领取的全部奖励啦！";
                break;
            case SystemLanguage.Thai:
                return "สุดยอดเลย! คุณได้รางวัลสูงสุดจากกิจกรรม แล้ว!";
                break;
            case SystemLanguage.Indonesian:
                return "Kamu udah dapetin semua hadiah maksimal dari event !";
                break;
            case SystemLanguage.French:
                return "T’as déjà atteint le max de récompenses pour l’événement !";
                break;
            case SystemLanguage.English:
            default:
                return "You’ve already hit the max rewards for the event!";
                break;
        }
    }
    

}