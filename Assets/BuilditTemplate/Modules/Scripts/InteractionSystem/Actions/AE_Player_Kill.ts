import { ActionBase } from "../ActionBase";
// import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import type { GameObject, Transform } from "UnityEngine";
import TrapManager from "../../../../Themes/JumpMaster_Traps/Scripts/TrapManager";

export default class AE_Player_Kill extends ActionBase {
    
    Awake() {
        // Note: To avoid a static instance in the scene, created for SpawnPoint
        TrapManager.instance;
    }
    
    override DoAction(): void {
        TrapManager.instance.TeleportCharacter();
    }
}
