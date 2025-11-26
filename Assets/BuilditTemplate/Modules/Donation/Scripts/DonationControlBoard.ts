import { ZepetoScriptBehaviour, ZepetoScriptableObject } from "ZEPETO.Script";
import { GameObject, Transform, Object, Vector2, WaitForSeconds } from "UnityEngine";

import DonationManager from "./DonationManager";
import DonationBoardContentItem from "./DonationBoardContentItem";
import { DonationTrigger } from "./DonationTrigger";
import { IDonationActionBase } from "./DonationActionBase";
import { DonationSettings, DonationActionSettings } from "./Types";

import UIPopup from "../../UI/Scripts/UIPopup";
import { GridLayoutGroup, ScrollRect } from "UnityEngine.UI";
import type { RoundedRectangleButton } from "ZEPETO.World.Gui";

// Error handling
import {ZepetoToast} from "ZEPETO.World.Gui";
import {Type} from "ZEPETO.World.Gui.ZepetoToast";

export enum BoardState {
    Display,
    Edit
}

/**
 * Controller used for donation objects,
 */
export default class DonationControlBoard extends ZepetoScriptBehaviour {

    public state: BoardState = BoardState.Display;
    
    private popup: UIPopup;
    private gridLayout: GridLayoutGroup;
    
    public StartEdit() {}
    
    public StopEdit() {}
    
    public SaveChanges() {}
    
    public DiscardChanges() {}
    
    
    // Contents
    public settings: DonationSettings;
    public itemPrefab: GameObject;
    
    private items: DonationBoardContentItem[] = [];
    
    public Show() {

        if (this.state == BoardState.Edit) return;
        
        this.state = BoardState.Edit;
        this.UpdateState();
    }
    
    public Hide() {
        // Hide Header + Footer
    }
    
    Start() {
        DonationManager.instance.board = this;
        
        this.popup = this.GetComponentInChildren<UIPopup>();
        this.gridLayout = this.popup.content.GetComponent<GridLayoutGroup>();

        // Hide the row prefab
        this.itemPrefab.SetActive(false);
        
        
        // Disable default handlers
        this.popup.cancelButton.OnClick.RemoveAllListeners();
        this.popup.cancelButton.OnClick.AddListener(() => {
            
            this.items.forEach(x => x.SetContent(x.config));
            
            this.state = BoardState.Display;
            this.UpdateState();
        });

        // Disable default handlers
        this.popup.actionButton.OnClick.RemoveAllListeners();
        this.popup.actionButton.OnClick.AddListener(() => {
            
            // Validation
            const validator = this.items.slice();
            validator.sort((x, y) => {
                return y.AmountValue - x.AmountValue;
            });
            for (let i = 0; i < validator.length - 1; i++)
                if (validator[i].AmountValue == validator[i+1].AmountValue) {
                    ZepetoToast.Show(Type.Warning, "Donation values must be unique");
                    return;
                }
            
            this.settings.actions = [];
            
            this.items.forEach(x => x.GetContent());
            this.items.sort((x, y) => { 
                return y.config.amount - x.config.amount;
            });
            
            for (let i = 0; i < this.items.length; i++) {
                let item = this.items[i];
                item.transform.SetSiblingIndex(i);
                this.settings.actions.push( item.GetContent() );
            }
            
            // Update the changes in controller
            DonationManager.instance.settings = this.settings;
            
            this.state = BoardState.Display;
            this.UpdateState();
        });
        
        this.UpdateState();
        
        this.StartCoroutine(this.LazyInit());
    }
    
    *LazyInit() {
        yield new WaitForSeconds(1);
        
        this.Initialize();
    }
    
    Initialize() {
        
        
        this.settings = DonationManager.instance.settings;

        // var ids = ["DN_TOAST"/*, "DN_CHECKPOINT", "DN_ACTION_2", "DN_ACTION_3", "DN_ACTION_4", "DN_TELEPORT_1"*/];
        //
        // for (let id of ids) {
        //
        //     const config = new  DonationActionSettings(id, 10, id);
        //     this.settings.actions.push(config);
        //
        //     let instance = Object.Instantiate(this.itemPrefab, this.popup.content) as GameObject;
        //
        //     const item = instance.GetComponent<DonationBoardContentItem>();
        //     item.SetContent(config);
        //     this.items.push(item);
        //     instance.SetActive(true);
        // }
        
        for (const config of this.settings.actions) {

            let instance = Object.Instantiate(this.itemPrefab, this.popup.content) as GameObject;

            const item = instance.GetComponent<DonationBoardContentItem>();
            item.SetContent(config);
            this.items.push(item);
            instance.SetActive(true);
        }
    }
    
    
    public UpdateState() {

        if (this.state == BoardState.Display) {

            this.popup.header.gameObject.SetActive(false);
            this.popup.footer.gameObject.SetActive(false);
            this.gridLayout.constraintCount = 2;
            this.gridLayout.cellSize = new Vector2(220, 30);
            
            this.items.forEach(x => x.SetEditMode(false));
        } 
        else if (this.state == BoardState.Edit) {
            this.popup.header.gameObject.SetActive(true);
            this.popup.footer.gameObject.SetActive(true);
            this.gridLayout.cellSize = new Vector2(320, 30);
            this.gridLayout.constraintCount = 1;

            this.items.forEach(x => x.SetEditMode(true));
        }
    }
    
}