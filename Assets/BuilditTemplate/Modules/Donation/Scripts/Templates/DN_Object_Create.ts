import {DonationTimedActionBase} from "../DonationActionBase"
import {
    Animator,
    GameObject,
    HumanBodyBones,
    Object,
    Transform,
    Vector3,
    WaitForEndOfFrame
} from 'UnityEngine';
import AE_Object_Spawner from "../../../Scripts/InteractionSystem/Actions/AE_Object_Spawner";
import {DonationEventData} from "../Types";
import {KnowSockets, ZepetoPlayers} from "ZEPETO.Character.Controller";


export default class DN_Object_Create extends DonationTimedActionBase
{
    private ae: AE_Object_Spawner;

    public targetObject: Object;
//    public spawnLocation: Transform;
    @SerializeField() private bodyBone: HumanBodyBones;
    public positionOffset: Vector3;

    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Object_Spawner>();

        this.ae.onCreate = (object: Object) => {
            this.StartCoroutine(this.OnCreate(object as GameObject));

        };

        this.ae.Init();
    }

    *OnCreate(instance: GameObject) {

        instance.transform.localPosition = this.positionOffset;
        
        yield new WaitForEndOfFrame();
    }


    DoAction(data: DonationEventData) {

        const animator: Animator = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(this.bodyBone);
        
        this.ae.targetObject = this.targetObject;
        this.ae.targetLocation = bone;
        this.ae.duration = this.duration;

        super.DoAction();
    }
}