import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Button } from 'UnityEngine.UI';
import { GameObject, Coroutine, WaitForSeconds } from 'UnityEngine';
import { TextMeshProUGUI } from 'TMPro';
import NpcBase from './NpcBase';


export default class NpcTalk extends ZepetoScriptBehaviour {

    @Header("UI References")
    @SerializeField()
    private npcText: TextMeshProUGUI;

    @SerializeField()
    private answerButtonPrefab: GameObject; // Prefab for answer buttons

    @SerializeField()
    private answerButtonParent: GameObject; // Parent transform for dynamically created buttons

    @SerializeField()
    private exitButton: Button;

    @SerializeField()
    private dialoguePanel: GameObject;

    @SerializeField()
    private uiToolObj: GameObject;
    @SerializeField()
    private npcNameText: TextMeshProUGUI;

    // Dialogue data - set by NpcBase
    private npcName: string = '';
    private dialogueText: string = '';
    private askTexts: string[] = [];
    private ansTexts: string[] = [];

    // Dynamically created button references
    private buttonArray: Button[] = [];
    private buttonTextArray: TextMeshProUGUI[] = [];
    private buttonGameObjects: GameObject[] = []; // Track created GameObjects for cleanup

    private isWaitingForAnswer: boolean = false;
    private closeDialogueCoroutine: Coroutine | null = null;
    private _npcManager: NpcBase | null = null;

    private ClearExistingButtons() {
        // Destroy all existing dynamically created buttons
        for (let i = 0; i < this.buttonGameObjects.length; i++) {
            if (this.buttonGameObjects[i]) {
                GameObject.Destroy(this.buttonGameObjects[i]);
            }
        }
        this.buttonArray = [];
        this.buttonTextArray = [];
        this.buttonGameObjects = [];
    }

    private CreateButtons() {
        // Clear existing buttons first
        this.ClearExistingButtons();

        if (!this.answerButtonPrefab || !this.answerButtonParent) {
            console.error('[NpcTalk] answerButtonPrefab or answerButtonParent is not assigned!');
            return;
        }

        // Create buttons based on dialogue options count
        for (let i = 0; i < this.askTexts.length; i++) {
            // Instantiate button from prefab
            const buttonObj = GameObject.Instantiate(this.answerButtonPrefab, this.answerButtonParent.transform) as GameObject;
            buttonObj.SetActive(true);

            // Get Button component
            const button = buttonObj.GetComponent<Button>();
            if (!button) {
                console.warn(`[NpcTalk] Button component not found in prefab at index ${i}`);
                GameObject.Destroy(buttonObj);
                continue;
            }

            // Find TextMeshProUGUI component (could be direct child or in children)
            const buttonText = buttonObj.GetComponentInChildren<TextMeshProUGUI>(true);
            if (!buttonText) {
                console.warn(`[NpcTalk] TextMeshProUGUI not found in button prefab at index ${i}`);
                GameObject.Destroy(buttonObj);
                continue;
            }

            // Store references
            this.buttonArray.push(button);
            this.buttonTextArray.push(buttonText);
            this.buttonGameObjects.push(buttonObj);

            // Set button text
            buttonText.text = this.askTexts[i] || '';

            // Setup click listener
            const index = i + 1; // 1-based index for OnAnswerSelected
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(() => this.OnAnswerSelected(index));
        }
    }

    private SetupButtons() {
        // Buttons are already created and set up in CreateButtons()
        // Just setup exit button here
        if (this.exitButton) {
            this.exitButton.onClick.RemoveAllListeners();
            this.exitButton.onClick.AddListener(() => this.OnExitButtonClicked());
        }
    }

    private DisableAllButtons() {
        for (let i = 0; i < this.buttonArray.length; i++) {
            if (this.buttonArray[i]) {
                this.buttonArray[i].gameObject.SetActive(false);
            }
        }
    }

    private EnableAllButtons() {
        for (let i = 0; i < this.buttonArray.length; i++) {
            if (this.buttonArray[i]) {
                this.buttonArray[i].gameObject.SetActive(true);
            }
        }
    }


    private OnAnswerSelected(answerIndex: number) {
        if (!this.isWaitingForAnswer) return;

        console.log(`[NpcTalk] Answer ${answerIndex} selected`);
        
        // Disable all buttons
        this.DisableAllButtons();
        
        // Show NPC response
        if (this.npcText && this.ansTexts.length >= answerIndex) {
            this.npcText.text = this.ansTexts[answerIndex - 1] || '';
        }

        this.isWaitingForAnswer = false;

        // Close dialogue panel after showing response using coroutine
        if (this.closeDialogueCoroutine) {
            this.StopCoroutine(this.closeDialogueCoroutine);
        }
        this.closeDialogueCoroutine = this.StartCoroutine(this.CloseDialogueAfterDelay());
    }

    private OnExitButtonClicked() {
        console.log("[NpcTalk] Exit button clicked!");
        
        // Stop any ongoing coroutine
        if (this.closeDialogueCoroutine) {
            this.StopCoroutine(this.closeDialogueCoroutine);
            this.closeDialogueCoroutine = null;
        }
        
        // Close dialogue immediately
        this.CloseDialoguePanel();
    }

    private *CloseDialogueAfterDelay() {
        console.log("[NpcTalk] Starting 2 second delay before closing dialogue");
        yield new WaitForSeconds(3.0);
        this.CloseDialoguePanel();
    }

    private CloseDialoguePanel() {
        if (this.dialoguePanel) {
            this.dialoguePanel.SetActive(false);
            this.uiToolObj.SetActive(true);
            console.log("[NpcTalk] Dialogue panel closed");
            
            // Call CloseDialogue to restore cameras
            if (this._npcManager) {
                console.log("[NpcTalk] Calling NpcBase.CloseDialogue()");
                this._npcManager.CloseDialogue();
            } else {
                console.warn("[NpcTalk] _npcManager is null, trying FindObjectOfType...");
                const npcManager = GameObject.FindObjectOfType<NpcBase>();
                if (npcManager) {
                    npcManager.CloseDialogue();
                } else {
                    console.error("[NpcTalk] Could not find NpcBase!");
                }
            }
        }
        this.closeDialogueCoroutine = null;
    }


    // Public method to set dialogue data
    public SetDialogueData(
        npcName: string,
        dialogueText: string,
        askTexts: string[],
        ansTexts: string[]
    ) {
        this.npcName = npcName;
        this.dialogueText = dialogueText;
        this.askTexts = askTexts || [];
        this.ansTexts = ansTexts || [];
        
        // Ensure askTexts and ansTexts have the same length
        const maxLength = Math.max(this.askTexts.length, this.ansTexts.length);
        if (this.askTexts.length !== this.ansTexts.length) {
            console.warn(`[NpcTalk] askTexts and ansTexts length mismatch. askTexts: ${this.askTexts.length}, ansTexts: ${this.ansTexts.length}`);
            // Pad with empty strings if needed
            while (this.askTexts.length < maxLength) {
                this.askTexts.push('');
            }
            while (this.ansTexts.length < maxLength) {
                this.ansTexts.push('');
            }
        }
        
        console.log(`[NpcTalk] Dialogue data set - NPC: ${npcName}, Options: ${this.askTexts.length}`);
    }

    // Public method to initialize dialogue
    public InitializeDialogue(npcManager?: NpcBase) {
        console.log(`[NpcTalk] Initializing dialogue...`);
        
        // Store NpcManager reference
        if (npcManager) {
            this._npcManager = npcManager;
        }
        
        if (this.dialogueText && this.askTexts.length > 0 && this.ansTexts.length > 0 && this.npcName) {
            // Create buttons dynamically based on dialogue options
            this.CreateButtons();
            this.LoadDialogueText();
            this.EnableAllButtons();
            this.SetupButtons();
            console.log(`[NpcTalk] Dialogue initialized successfully with ${this.askTexts.length} options.`);
        } else {
            console.warn(`[NpcTalk] Cannot initialize - missing data`);
        }
    }

    // Private method to load dialogue text
    private LoadDialogueText() {
        // Set NPC name
        if (this.npcNameText) {
            this.npcNameText.text = this.npcName;
        }
        
        // Set dialogue text
        if (this.npcText) {
            this.npcText.text = this.dialogueText;
        }
        
        // Button texts are already set in CreateButtons()
        
        this.isWaitingForAnswer = true;
        console.log(`[NpcTalk] Loaded dialogue text`);
    }
}