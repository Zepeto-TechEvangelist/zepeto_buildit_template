import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Transform, Vector3, Time, Collider, WaitForSeconds, Coroutine } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {UnityEvent, UnityEvent$1} from "UnityEngine.Events";
import Action from "../../Scripts/InteractionSystem/Action";
import AdvertisementController from "../AdvertisementController";

export abstract class AdvertisementActionBase extends ZepetoScriptBehaviour {
    protected _adController: AdvertisementController;
    protected _action: Action;

    Start() {
        this._action = this.GetComponentInChildren<Action>();
        this._adController = this.GetComponentInChildren<AdvertisementController>();
        
        this._adController.OnViewAdEvent.add_handler(() => {
            this._action?.DoAction() 
        });
    }
}