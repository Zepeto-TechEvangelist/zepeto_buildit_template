// Assets/Scripts/UI/InteractButtonController.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Button, Image } from 'UnityEngine.UI';
import { GameObject } from 'UnityEngine';
import { TextMeshProUGUI } from 'TMPro';
import Localization from '../../../BuilditTemplate/Modules/Localization/ZepetoScript/Localization';

/**
 * Common interaction interface for all interactable objects
 * (e.g., portals, NPCs, triggers, etc.).
 */
export interface IInteractable {
    Interact(): void;
}

/**
 * Handles the global “Interact” UI button in the scene.
 * - Shows/hides itself depending on nearby interactable targets.
 * - Displays optional prompt text.
 * - Invokes the Interact() method on the current target when clicked.
 */
export default class InteractButtonController extends ZepetoScriptBehaviour {

    /** Reference to the UI Button component. */
    public button: Button | null = null;

    /** Highlight or background visual element. */
    public highlightImage: GameObject | null = null;

    /** Label displaying the prompt text (e.g., “Talk”, “Enter”). */
    public label: TextMeshProUGUI | null = null;

    /** Singleton instance (for quick global access). */
    private static _instance: InteractButtonController;
    public static get instance(): InteractButtonController { return this._instance; }

    /** Current target that implements IInteractable. */
    private _target: IInteractable | null = null;

    Awake() {
        InteractButtonController._instance = this;

        if (this.button) {
            this.button.onClick.RemoveAllListeners();
            this.button.onClick.AddListener(() => this.onClick());
        }

        this.setVisible(false);
    }

    /**
     * Assigns a new interactable target and updates UI visibility.
     * @param target Interactable object to assign.
     * @param labelText Optional text to display (e.g., “Enter”, “Talk”).
     */
    public SetTarget(target: IInteractable | null, labelText?: string): void {
        if (this._target === target) return;

        this._target = target;
        this.setVisible(target !== null);

        if (this.label) {
            if (labelText) {
                console.log("[InteractButtonController] Setting label text to: " + labelText);
                this.label.text = labelText; //Localization.instance.GetLocalizedText(labelText);
            } else {
                this.label.text = "";
            }
        }
    }

    /**
     * Controls visibility of the interact button UI.
     * @param on Whether to show or hide the UI.
     */
    private setVisible(on: boolean): void {
        if (this.highlightImage) this.highlightImage.SetActive(on);
        if (!on && this.label) this.label.text = "";
    }

    /** Called when the UI button is clicked. */
    private onClick(): void {
        console.log("[InteractButtonController] Button clicked!");
        if (!this._target) {
            console.warn("[InteractButtonController] No target set!");
            return;
        }
        console.log("[InteractButtonController] Calling target.Interact()");
        this._target.Interact();
    }
}