import { Collider, Debug, GameObject } from 'UnityEngine';
import { UnityEvent } from 'UnityEngine.Events'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class EventOnTrigger extends ZepetoScriptBehaviour {
    @SerializeField()
    public Event: UnityEvent;

   

    public OnTriggerEnter(collider: Collider) {
        //note to zepeto : should really have an easier way to check if collider is local player.
        if (collider != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }

        if (this.Event != null) this.Event.Invoke();
    }

    //Utils method
    public static BindEvent(object: GameObject, event: () => void) {
        let eventOnTrigger = object.GetComponent<EventOnTrigger>();
        if (eventOnTrigger != null) {
            eventOnTrigger.Event.AddListener(() => event());
        }
        else {
            Debug.LogError(object.name + " (EventOnTrigger.ts) = object does not have EventOnTrigger component!", object);
        }
    }

}