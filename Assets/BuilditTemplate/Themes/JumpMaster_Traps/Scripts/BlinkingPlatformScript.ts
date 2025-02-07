import { Collider, Renderer, WaitForSeconds } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

export default class BlinkingPlatformScript extends ZepetoScriptBehaviour {

    // Number of seconds the platform stays fully visible.
    @SerializeField() visibleTime: number = 2;
    // Number of seconds the platform stays fully invisible.
    @SerializeField() invisibleTime: number = 2;
    // Platform's colliders.
    private objColliders: Collider[];
    // Platform's renderer.
    private objRenderer: Renderer;

    Start() {    
        // Find all colliders of BlinkingPlatformScript and initialize objCollider.
        this.objColliders = this.GetComponentsInChildren<Collider>();
        // Find the renderer of BlinkingPlatformScript and initialize objRenderer.
        this.objRenderer = this.GetComponentInChildren<Renderer>();
        // Start blinking the platform.
        this.StartCoroutine(this.Blink());
    }

    // Coroutine for blinking the platform.
    *Blink() {
        while (true) {
            if (this.objColliders) {
                // 1. Platform invisible, colliders disabled.
                for (const collider of this.objColliders) {
                    collider.enabled = false;
                }
                this.objRenderer.enabled = false;
                yield new WaitForSeconds(this.invisibleTime);
                // 2. Platform visible, colliders enabled.
                for (const collider of this.objColliders) {
                    collider.enabled = true;
                }
                this.objRenderer.enabled = true;
                yield new WaitForSeconds(this.visibleTime);
            }
        }
    }

}