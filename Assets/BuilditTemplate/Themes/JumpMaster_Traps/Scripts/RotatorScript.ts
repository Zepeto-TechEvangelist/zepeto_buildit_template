import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class RotatorScript extends ZepetoScriptBehaviour {

    // Speed of rotator in x direction.
    @SerializeField() private xSpeed: number = 0;
    // Speed of rotator in y direction.
    @SerializeField() private ySpeed: number = 5;
    // Speed of rotator in z direction.
    @SerializeField() private zSpeed: number = 0;

    Update() {
        this.transform.Rotate(this.xSpeed, this.ySpeed, this.zSpeed);
    }

}