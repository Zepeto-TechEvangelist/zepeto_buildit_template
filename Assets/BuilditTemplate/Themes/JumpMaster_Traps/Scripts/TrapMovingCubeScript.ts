import { Collider, Time, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';

export default class TrapMovingCubeScript extends ZepetoScriptBehaviour {

    // Moving speed of the cube.
    @SerializeField() private speed: number = 2;
    // Cube's starting position.
    private startPosition: Vector3;
    // Cube's ending position.
    private endPosition: Vector3;
    // Cube's current target position.
    private targetPosition: Vector3;
    // Whether the cube is moving from start point to end point.
    private startToEnd: bool = true;

    Awake() {
        TrapManager.instance;
        
        // Find the child object 'startPoint' and initialize startObj.
        const startObj = this.transform.Find("startPoint");
        if (startObj) {
            // Initialize startPosition with startObj's position.
            this.startPosition = startObj.position;
        }

        // Find the child object 'endPoint' and initialize endObj.
        const endObj = this.transform.Find("endPoint");
        if (endObj) {
            // Initialize endPosition with endObj's position.
            this.endPosition = endObj.position;
        }
    }

    Start() {    
        
        // Move the cube's position to startPosition.
        if (this.startPosition) {
            this.transform.position = this.startPosition;
        }

        // Set endPosition as the target position.
        if (this.endPosition) {
            this.targetPosition = this.endPosition;
        }
    }

    Update() {
        // If startPosition or endPosition is null, return.
        if (this.startPosition === null || this.endPosition === null) {
            return; 
        }
    
        // If the cube is currently moving from startPoint to endPoint, change its position to make it move towards endPosition.
        if (this.startToEnd) {
            this.transform.position = Vector3.MoveTowards(this.transform.position, this.endPosition, this.speed * Time.deltaTime);
        } else {
            // Otherwise, change its position to make it move towards startPosition.
            this.transform.position = Vector3.MoveTowards(this.transform.position, this.startPosition, this.speed * Time.deltaTime);
        }
    
        // Calculate the distance between the cube's current position and the target position.
        const distance = Vector3.Distance(this.transform.position, this.targetPosition);
        if (distance < 0.001) {
            // If the cube reached the target position and was moving from startPoint to endPoint, change its target position to startPoint.
            if (this.startToEnd) {
                this.targetPosition = this.startPosition;
            } else {
                // If the cube reached the target position and was moving from endPoint to startPoint, change its target position to endPoint.
                this.targetPosition = this.endPosition;
            }
            // Negate startToEnd to change the cube's moving direction.
            this.startToEnd = !this.startToEnd;
        }
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (TrapManager.instance.zepetoCharacter === null || (TrapManager.instance.zepetoCharacter && collider.gameObject !== TrapManager.instance.zepetoCharacter.gameObject)) {
            return;
        }

        // If the character collided with the cube, teleport it to the most recent checkpoint.
        TrapManager.instance?.TeleportCharacter();
    }

}