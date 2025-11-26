import {DonationTimedActionBase} from "../DonationActionBase"
import {Animator, GameObject, HumanBodyBones, Object, Transform, Vector3, WaitForEndOfFrame} from 'UnityEngine';
import AE_Object_Spawner from "../../../Scripts/InteractionSystem/Actions/AE_Object_Spawner";
import {DonationEventData} from "../Types";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import { DonationLocalization } from "../Localization";
import { Text } from "UnityEngine.UI";
import WorldSpaceCanvas from "../../../UI/Scripts/WorldSpaceCanvas";

export default class DN_Display_Profile extends DonationTimedActionBase
{
    private ae: AE_Object_Spawner;

    public targetObject: Object;
    public spawnLocation: Transform;
    public positionOffset: Vector3 = new Vector3(0, 1, 0);

    private text: string;
    
    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Object_Spawner>();

        this.ae.onCreate = (object: Object) => {
            this.StartCoroutine(this.OnCreate(object as GameObject));

        };

        this.ae.Init();
    }

    *OnCreate(instance: GameObject) {

        const animator: Animator = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(HumanBodyBones.Head);
        
        instance.transform.localPosition = this.positionOffset;
        instance.GetComponentInChildren<Text>().text = this.text;
        let wc = instance.GetComponent<WorldSpaceCanvas>();
        wc.positionOffset = this.positionOffset;
        wc.followTransform = bone;
        
        yield new WaitForEndOfFrame();
    }


    DoAction(data: DonationEventData) {

        this.text = data.sender_nickname;
        // Full donation messsage
        //DonationLocalization.ReceiveNotification(data.sender_nickname, data.amount, "");
        
        const animator: Animator = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(HumanBodyBones.Head);

        this.ae.targetObject = this.targetObject;
        this.ae.targetLocation = this.spawnLocation;
        this.ae.duration = this.duration;

        super.DoAction();
    }
}