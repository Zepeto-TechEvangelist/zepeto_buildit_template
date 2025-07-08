import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType} from '../../../Modules/Scripts/PlayerTrigger';
import {UnityEvent$1} from "UnityEngine.Events";

export default class ContactTrap extends PlayerTrigger {
    
    Awake() {
        TrapManager.instance;
        
        this.OnPlayerEnter.AddListener((_) => { 
            TrapManager.instance.TeleportCharacter();
        });
    }

}