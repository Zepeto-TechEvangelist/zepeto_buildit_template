import { Collider, Quaternion, Rigidbody, Time, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class RotatingPlatformScript extends ZepetoScriptBehaviour {

    // Speed of the platform in the x direction.
    @SerializeField() private xSpeed: number = 0;
    // Speed of the platform in the y direction.
    @SerializeField() private ySpeed: number = 150;
    // Speed of the platform in the z direction.
    @SerializeField() private zSpeed: number = 0;
    // Platform's Rigidbody.
    private objRigidbody: Rigidbody;
    // Current player's ZepetoCharacter.
    private zepetoCharacter : ZepetoCharacter;
    // Character’s local offset relative to the platform.
    private localOffset: Vector3;
    // Character's local rotation offset relative to the platform.
    private localRotationOffset: Quaternion;
    // Whether the character is on the platform.
    private isOnPlatform: bool;
    // Whether the character jumped or moved while on the platform.
    private jumpedOrMoved: bool;

    Awake() {
        // Get the platform's Rigidbody component and initialize objRigidbody.
        this.objRigidbody = this.GetComponent<Rigidbody>();
    }

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });
    }

    FixedUpdate() {
        // If zepetoCharacter is null, return.
        if (this.zepetoCharacter === null) {
            return;
        }

        // Amount of rotation to apply this frame.
        const deltaRotation = Quaternion.Euler(this.xSpeed * Time.fixedDeltaTime, this.ySpeed * Time.fixedDeltaTime, this.zSpeed * Time.fixedDeltaTime);
        // Combine the platform's current rotation with deltaRotation.
        const newPlatformRotation = Quaternion.op_Multiply(this.objRigidbody.rotation, deltaRotation);
        // Apply the new rotation to the platform.
        this.objRigidbody.MoveRotation(newPlatformRotation);

        // If the character jumped or moved while on the platform, set jumpedOrMoved to true.
        if (this.zepetoCharacter && (this.zepetoCharacter.motionState.currentJumpState !== -1 || this.zepetoCharacter.motionState.currentMoveState !== -1)) {
            this.jumpedOrMoved = true;
        }

        // Recalculate offsets if the character moved or jumped while on the platform.
        if (this.isOnPlatform && this.zepetoCharacter && this.jumpedOrMoved) {
            this.CalculateOffsets();
            this.jumpedOrMoved = false;
        }

        // Fix the character's position and rotation if the character is not moving or jumping.
        if (this.isOnPlatform 
            && this.zepetoCharacter 
            && this.zepetoCharacter.motionState.currentJumpState === -1
            && this.zepetoCharacter.motionState.currentMoveState === -1) {
            
            // Convert local offset back into world position to get the character's world position given the platform's current position.
            const newPosition = this.transform.TransformPoint(this.localOffset);
            // Update character's position.
            this.zepetoCharacter.transform.position = newPosition;
            // Multiply the platform's current rotation by localRotationOffset to make the character's orientation follow the platform’s rotation.
            const newRotation = Quaternion.op_Multiply(this.transform.rotation, this.localRotationOffset);
            // Update character's rotation.
            this.zepetoCharacter.transform.rotation = newRotation;
        }
    }

    OnTriggerEnter(collider : Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }
        
        // If zepetoCharacter collided with the platform, calculate the position and rotation offsets and set isOnPlatform to true.
        if (this.zepetoCharacter) {
            this.CalculateOffsets();
        } else {
            return;
        }
        this.isOnPlatform = true;
    }

    OnTriggerExit(collider : Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // Set isOnPlatform to false, since the character left the platform.
        this.isOnPlatform = false;
    }

    private CalculateOffsets() {
        // If the character is not null, calculate offsets.
        if (this.zepetoCharacter !== null) {
            // this.transform.InverseTransformPoint() converts a world position into local coordinates relative to the platform's position.
            this.localOffset = this.transform.InverseTransformPoint(this.zepetoCharacter.transform.position);
            // Calculate the difference between the platform’s current rotation and the character’s rotation.
            // Inverse of the platform’s rotation removes the platform’s rotation from the character’s world rotation, which gives the character’s orientation relative to the platform.
            // Multiply character's rotation with inveresed platform's rotation to combine them.
            this.localRotationOffset = Quaternion.op_Multiply(Quaternion.Inverse(this.transform.rotation), this.zepetoCharacter.transform.rotation);
        }
    }
    
}