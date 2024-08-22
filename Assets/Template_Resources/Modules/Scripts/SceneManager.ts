import { BoxCollider, GameObject, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TeleportArea from './TeleportArea';

export default class SceneManager extends ZepetoScriptBehaviour {


    public deathAreaPosition: number = -500;

    Start() {
        this.SetTeleportArea();
    }

    private SetTeleportArea() {
        const cube = new GameObject;
        cube.transform.position = new Vector3(0, this.deathAreaPosition, 0);
        const col = cube.AddComponent<BoxCollider>();
        col.isTrigger = true;
        col.size = new Vector3(5000, 50, 5000);
        cube.AddComponent<TeleportArea>();
    }

}