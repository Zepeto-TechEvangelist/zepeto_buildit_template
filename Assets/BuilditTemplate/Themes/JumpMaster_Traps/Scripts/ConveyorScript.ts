import { Collider, Time, Transform, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class ConveyorScript extends ZepetoScriptBehaviour {

    // Speed of the conveyor.
    @SerializeField() private conveyorSpeed: number = 3;
    // Child object to get the moving direction of the conveyor.
    private conveyorDirectionObj: Transform;
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Whether the player is on the conveyor or not.
    private isOnConveyor: bool = false;

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Find the child object "Direction".
        this.conveyorDirectionObj = this.transform.Find("Direction");
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the conveyor collided with a game object other than zepetoCharacter, return.
        if (!this.zepetoCharacter || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // The character is in contact with the conveyor, so set isOnconveyor to true.
        this.isOnConveyor = true;
    }

    OnTriggerExit(collider: Collider) {
        // If zepetoCharacter is null or the conveyor collided with a game object other than zepetoCharacter, return.
        if (!this.zepetoCharacter || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // The character is no longer in contact with the conveyor, so set isOnconveyor to false and reset additionalWalkSpeed and additionalRunSpeed.
        this.isOnConveyor = false;
        this.zepetoCharacter.additionalWalkSpeed = 0;
        this.zepetoCharacter.additionalRunSpeed = 0;
    }

    FixedUpdate() {
        if (this.isOnConveyor && this.zepetoCharacter) {
            // Move the character if it is on the conveyor and idle.
            if (this.zepetoCharacter.motionState.currentMoveState === -1) {
                const dir = this.conveyorDirectionObj.forward;
                const moveDistance = this.conveyorSpeed * Time.fixedDeltaTime;
                const offset = Vector3.op_Multiply(dir, moveDistance);
                const currPos = this.zepetoCharacter.transform.position;
                const newPos = Vector3.op_Addition(currPos, offset);
                this.zepetoCharacter.transform.position = newPos;
            }

            // If the character is on the conveyor and is either walking or running, calculate whether it's moving in the same direction as the conveyor or not.
            // Find the unit vector of the character and the conveyor.
            const charcterDir = this.zepetoCharacter.transform.forward.normalized;
            const conveyorDir = this.conveyorDirectionObj.forward.normalized;
            const dot = Vector3.Dot(charcterDir, conveyorDir);

            if (dot > 0) {
                // If the character is moving in the same direction as the conveyor, increase its walking and running speed.
                this.zepetoCharacter.additionalWalkSpeed = this.conveyorSpeed;
                this.zepetoCharacter.additionalRunSpeed = this.conveyorSpeed;
            } else {
                // Otherwise, decrease its walking and running speed.
                this.zepetoCharacter.additionalWalkSpeed = -this.conveyorSpeed;
                this.zepetoCharacter.additionalRunSpeed = -this.conveyorSpeed;
            }
        }
    }

}