import { Collider, Time, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class FallingPlatformScript extends ZepetoScriptBehaviour {

    // Number of seconds the platform stays without falling.
    @SerializeField() private duration: number = 2;
    // Platform's falling speed. 
    @SerializeField() private fallingSpeed: number = 30;
    // Platform's falling distance.
    @SerializeField() private fallingDistance: number = 30;
    // Current player's ZepetoCharacter.
    private zepetoCharacter: ZepetoCharacter;
    // Position of the platform before falling.
    private originalPosition: Vector3;
    // Position of the platform after falling.
    private targetPosition: Vector3;

    Start() {    
        // Initialize zepetoCharacter.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        // Initialize originalPosition with the position of the platform before falling.
        this.originalPosition = this.transform.position;
        // Initialize targetPosition with the position of the platform after falling.
        this.targetPosition = new Vector3(this.transform.position.x, this.transform.position.y - this.fallingDistance, this.transform.position.z);
    }

    OnTriggerEnter(collider: Collider) {
        // If zepetoCharacter is null or the collider collided with an object other than zepetoCharacter, return.
        if (this.zepetoCharacter === null || (this.zepetoCharacter && collider.gameObject !== this.zepetoCharacter.gameObject)) {
            return;
        }

        // Start making the platform fall.
        this.StartCoroutine(this.Fall());
    }

    // Coroutine for making the platform move to the target position.
    *Fall() {
        // Wait until the set duration time.
        yield new WaitForSeconds(this.duration);

        while (true) {
            // Calculate the distance between the platform's current position and the target position.
            let distance = Vector3.Distance(this.transform.position, this.targetPosition);
            // If the platform reaches the target position, stop moving.
            if (distance < 0.001) {
                break;
            }
            // If the platform hasn't reached the target position yet, continue moving it towards the target position.
            this.transform.position = Vector3.MoveTowards(this.transform.position, this.targetPosition, this.fallingSpeed * Time.deltaTime);
            // Wait for a frame.
            yield null;
        }

        // After platform reaches the target position, move it back to its original position.
        this.transform.position = this.originalPosition;
    }

}