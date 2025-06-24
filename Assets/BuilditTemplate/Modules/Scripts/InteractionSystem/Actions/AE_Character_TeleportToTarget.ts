import { ActionBase } from "../ActionBase";
import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import type { GameObject, Transform } from "UnityEngine";


export default class AE_Character_TeleportToTarget extends ActionBase {

    public character?: ZepetoCharacter;
    public targetObject?: Transform;

    override DoAction(): void {
        this.character ??= ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        this.character.Teleport(this.targetObject.position, this.targetObject.rotation);
    }
}
