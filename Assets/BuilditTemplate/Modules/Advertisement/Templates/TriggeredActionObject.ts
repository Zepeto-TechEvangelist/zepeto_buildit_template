import { Transform, Vector3, Time, Collider, WaitForSeconds, Coroutine } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TriggeredActionObject extends ZepetoScriptBehaviour {
    
    @Header("Custom objects shortcuts")
    
    @Tooltip("Adjust trigger, e.g detection area")
    public trigger: Transform;
    
    @Tooltip("Adjust the action parameters, e.g activated objects")
    public action: Transform;
    
    @Tooltip("Able to change the 3D model")
    public model: Transform;
    
}
