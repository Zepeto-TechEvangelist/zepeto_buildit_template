import { Collider, Quaternion, Vector3 } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TeleportArea extends ZepetoScriptBehaviour {

    public destination: Vector3 = Vector3.zero;
    
    private localPlayerCollider: Collider;

    private OnTriggerEnter(coll: Collider) {
        if (coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }
        
        ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.Teleport(this.destination, Quaternion.identity);
    }

}