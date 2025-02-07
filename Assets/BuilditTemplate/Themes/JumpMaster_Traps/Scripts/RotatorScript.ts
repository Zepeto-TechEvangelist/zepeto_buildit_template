import { Rigidbody } from 'UnityEngine';
import { Quaternion, Time } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class RotatorScript extends ZepetoScriptBehaviour {

    // Speed of rotator in x direction.
    @SerializeField() private xSpeed: number = 0;
    // Speed of rotator in y direction.
    @SerializeField() private ySpeed: number = 150;
    // Speed of rotator in z direction.
    @SerializeField() private zSpeed: number = 0;
    // Rotator's Rigidbody.
    private objRigidbody: Rigidbody;

    Awake() {
        // Get rotator's Rigidbody component and initialize objRigidbody.
        this.objRigidbody = this.GetComponent<Rigidbody>();
    }

    FixedUpdate() {
        // Amount of rotation to apply this frame.
        const deltaRotation = Quaternion.Euler(this.xSpeed * Time.fixedDeltaTime, this.ySpeed * Time.fixedDeltaTime, this.zSpeed * Time.fixedDeltaTime);
        // Combine the platform's current rotation with deltaRotation.
        const newPlatformRotation = Quaternion.op_Multiply(this.objRigidbody.rotation, deltaRotation);
       // Apply the new rotation to rotator.
        this.objRigidbody.MoveRotation(newPlatformRotation);
    }

}