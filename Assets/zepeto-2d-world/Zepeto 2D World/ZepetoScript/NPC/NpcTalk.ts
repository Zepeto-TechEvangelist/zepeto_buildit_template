import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Button, Text } from 'UnityEngine.UI';
import { GameObject, Coroutine, WaitForSeconds } from 'UnityEngine';
import NpcBase from './NpcBase';
import Localization from '../../../../BuilditTemplate/Modules/Localization/ZepetoScript/Localization';
import { DialogueData } from "./NpcDialogueData";

export default class NpcTalk extends ZepetoScriptBehaviour {

    @Header("UI References")
    @SerializeField()
    private npcText: Text;

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
    private npcNameText: Text;
    
    private useLocalization: boolean = false;
    
    // Dialogue data - set by NpcBase
    private npcName: string = '';
    private dialogueText: string = '';
    private askTexts: string[] = [];
    private ansTexts: string[] = [];

    // Dynamically created button references
    private buttonArray: Button[] = [];
    private buttonTextArray: Text[] = [];
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

        // Limit to maximum 3 buttons
        const maxButtons = Math.min(this.askTexts.length, 3);

        // Create buttons based on dialogue options count (max 3)
        for (let i = 0; i < maxButtons; i++) {
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

            // Find Text component (could be direct child or in children)
            const buttonText = buttonObj.GetComponentInChildren<Text>(true);
            if (!buttonText) {
                console.warn(`[NpcTalk] Text component not found in button prefab at index ${i}`);
                GameObject.Destroy(buttonObj);
                continue;
            }

            // Store references
            this.buttonArray.push(button);
            this.buttonTextArray.push(buttonText);
            this.buttonGameObjects.push(buttonObj);

            // Set button text
            // buttonText.text = this.askTexts[i] || '';
            buttonText.text = '';
            if (this.askTexts[i])
                this.SetLocalizedText(buttonText, this.askTexts[i]);
            
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
        
        // Disable all buttons
        this.DisableAllButtons();
        
        // Show NPC response
        if (this.npcText && this.ansTexts.length >= answerIndex) {
            // this.npcText.text = this.ansTexts[answerIndex - 1] || '';
            this.npcText.text = '';
            if (this.ansTexts[answerIndex - 1])
                this.SetLocalizedText(this.npcText, this.ansTexts[answerIndex - 1]);
        }

        this.isWaitingForAnswer = false;

        // Close dialogue panel after showing response using coroutine
        if (this.closeDialogueCoroutine) {
            this.StopCoroutine(this.closeDialogueCoroutine);
        }
        this.closeDialogueCoroutine = this.StartCoroutine(this.CloseDialogueAfterDelay());
    }

    private OnExitButtonClicked() {
        
        // Stop any ongoing coroutine
        if (this.closeDialogueCoroutine) {
            this.StopCoroutine(this.closeDialogueCoroutine);
            this.closeDialogueCoroutine = null;
        }
        
        // Close dialogue immediately
        this.CloseDialoguePanel();
    }

    private *CloseDialogueAfterDelay() {
        yield new WaitForSeconds(3.0);
        this.CloseDialoguePanel();
    }

    private CloseDialoguePanel() {
        
        // Call CloseDialogue FIRST to restore cameras before closing panel
        if (this._npcManager) {
            this._npcManager.CloseDialogue();
        } else {
            console.warn("[NpcTalk] _npcManager is null, trying to find parent NpcBase...");
            // Try to find NpcBase in parent hierarchy
            let current = this.transform.parent;
            let npcManager: NpcBase | null = null;
            
            while (current && !npcManager) {
                npcManager = current.GetComponent<NpcBase>();
                if (!npcManager) {
                    current = current.parent;
                }
            }
            
            if (npcManager) {
                npcManager.CloseDialogue();
            } else {
                console.error("[NpcTalk] Could not find NpcBase in parent hierarchy!");
            }
        }
        
        // Then close the dialogue panel
        if (this.dialoguePanel) {
            this.dialoguePanel.SetActive(false);
        }
        
        if (this.uiToolObj) {
            this.uiToolObj.SetActive(true);
        }
        
        this.closeDialogueCoroutine = null;
    }


    // Helper method to shuffle array randomly (Fisher-Yates algorithm)
    private ShuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    public SetDialogueWithData(data: DialogueData) {
        
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
        let tempAskTexts = askTexts || [];
        let tempAnsTexts = ansTexts || [];
        
        // Ensure askTexts and ansTexts have the same length
        const maxLength = Math.max(tempAskTexts.length, tempAnsTexts.length);
        if (tempAskTexts.length !== tempAnsTexts.length) {
            console.warn(`[NpcTalk] askTexts and ansTexts length mismatch. askTexts: ${tempAskTexts.length}, ansTexts: ${tempAnsTexts.length}`);
            // Pad with empty strings if needed
            while (tempAskTexts.length < maxLength) {
                tempAskTexts.push('');
            }
            while (tempAnsTexts.length < maxLength) {
                tempAnsTexts.push('');
            }
        }
        
        // If more than 3 options, randomly select 3
        if (tempAskTexts.length > 3) {
            // Create pairs of ask and ans texts
            const pairs: { ask: string, ans: string }[] = [];
            for (let i = 0; i < tempAskTexts.length; i++) {
                pairs.push({ ask: tempAskTexts[i], ans: tempAnsTexts[i] });
            }
            
            // Shuffle and take first 3
            const shuffledPairs = this.ShuffleArray(pairs).slice(0, 3);
            
            this.askTexts = shuffledPairs.map(pair => pair.ask);
            this.ansTexts = shuffledPairs.map(pair => pair.ans);
        } else {
            this.askTexts = tempAskTexts;
            this.ansTexts = tempAnsTexts;
        }
    }

    // Public method to initialize dialogue
    public InitializeDialogue(npcManager?: NpcBase) {
        
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
        } else {
            console.warn(`[NpcTalk] Cannot initialize - missing data`);
        }
    }

    // Private method to load dialogue text
    private LoadDialogueText() {
        // Set NPC name
        if (this.npcNameText) {
            // this.npcNameText.text = this.npcName;
            this.SetLocalizedText(this.npcNameText, this.npcName);
        }
        
        // Set dialogue text
        if (this.npcText) {
            this.SetLocalizedText(this.npcText, this.dialogueText);
            // this.npcText.text = this.dialogueText;
        }
        
        // Button texts are already set in CreateButtons()
        
        this.isWaitingForAnswer = true;
    }
    
    private SetLocalizedText(text: Text, key: string) {
        if (this.useLocalization == false)
            text.text = key;
        else
            Localization.instance.ApplyLocalization(text, key);
    }
}