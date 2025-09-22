import { Quaternion, Vector3, HumanBodyBones } from 'UnityEngine'
import { ZepetoScriptableObject } from 'ZEPETO.Script'

export default class VehicleAttachObjectSetting extends ZepetoScriptableObject
{
    public prefabKey: string;
    public useBoneTransform: bool = true;
    public container: HumanBodyBones = HumanBodyBones.Spine;
    public offset: Vector3;
    public rotation: Vector3;
    public get quaternion(): Quaternion { return Quaternion.Euler(this.rotation) };
}