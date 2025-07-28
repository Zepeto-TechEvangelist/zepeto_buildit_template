import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import { Action } from 'System';
import {ItemKeyword, ShopService} from 'ZEPETO.Module.Shop';
import {
    FontStyle,
    GameObject,
    MeshRenderer,
    Object,
    RectTransform,
    SkinnedMeshRenderer,
    Transform,
    WaitUntil
} from 'UnityEngine';
import {Button, LayoutRebuilder, ScrollRect, Text} from 'UnityEngine.UI';
import {ZepetoContext, ZepetoPropertyFlag} from 'Zepeto';
import {ZepetoPlayers, ZepetoCharacter} from 'ZEPETO.Character.Controller';
import {Item} from 'ZEPETO.Module.Content';
import UIMenuController from './UIMenuController';
import WardrobeItemController from './WardrobeItemController';
import {InventoryRecord, InventoryService} from 'ZEPETO.Inventory';
import { UnityEvent, UnityAction } from 'UnityEngine.Events';

import {
    ClothesPreviewer,
    ItemContent, ItemContentsRequest,
    Mannequin,
    MannequinComponent,
    MannequinInteractable,
    MannequinPreviewer
} from "ZEPETO.Mannequin";



export default class WardrobeController extends ZepetoScriptBehaviour {
    
    @HideInInspector()
    public menu: UIMenuController;
    
    public emptyListIndicator: GameObject;

    public resetButton: Button;
    
    public isInventory: boolean = true;
    
    public itemPrefab: GameObject;
    
    public itemCanvas: Transform;
    public itemCategory: ItemKeyword;


    public categoryScroll: ScrollRect;
    public categoryPrefab: GameObject;
    public categoryCanvas: Transform;
    
    public cachedItems: Map<ItemKeyword, Item[]> = new Map<ItemKeyword, Item[]>();
    
    public activeItems: Item[];
    public bodyModifiers: ZepetoPropertyFlag[];
    
    private _activeSelection: WardrobeItemController;
    
    private categories: ItemKeyword[] = [
        ItemKeyword.outwear,
        ItemKeyword.top,
        ItemKeyword.pants,
        ItemKeyword.skirt,
        ItemKeyword.onepiece,
        ItemKeyword.footwear,
        ItemKeyword.accessory,
        ItemKeyword.jewelry,
        ItemKeyword.headwear,
        ItemKeyword.eyewear,
        ItemKeyword.socks,
        // ItemKeyword.makeup,
        // ItemKeyword.hair,
        // ItemKeyword.bodyfigure
    ];
    
    
    // When the scene starts, create a player with the provided user ID and begin fetching and displaying the items.
    Start() {
        this.transform.GetChild(0).gameObject.SetActive(true);
        this.emptyListIndicator?.SetActive(false);
        
        // Hide the prefabs
        for (var i = 0; i < this.categories.length; i++)
            this.cachedItems.set(this.categories[i], []);
        
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            // this.StartCoroutine(this.LoadInventory());   // disabled currently
            this.StartCoroutine(this.CoGetMyItem());

            this._owner = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this.InitOriginalItems();
        });
        
        this.StartCoroutine(this.CreateCategoryMenu());
        
        this.menu ??= this.GetComponent<UIMenuController>();
        this.menu.onOpened.AddListener(() => {
            this.OnShow();
        });

        this.resetButton.onClick.AddListener(() => {
            this.ResetCharacterItems(() => {
                this.UpdateCurrentItems();
                this.UpdateSelection();
            });
        });
    }
    
    private selectedCategoryItem: Button = null;
    
    private *CreateCategoryMenu() {
        
        var strings: string[] = [
            "Outwear",
            "Top",
            "Pants",
            "Skirt",
            "Dress",
            "Footwear",
            "Accessory",
            "Jewelry",
            "Headwear",
            "Eyewear",
            "Socks",
            // "Makeup",
            // "Hair",
            // "Bodyfigure"
        ];
        
        for (let i = 0; i < strings.length; i++) {
            let category = this.categories[i];

            const item = Object.Instantiate(this.categoryPrefab, this.categoryCanvas) as GameObject;
            
            let text = item.GetComponentInChildren<Text>();
            text.text = strings[i];
            
            let button: Button = item.GetComponentInChildren<Button>();
            button.onClick.AddListener(() => {
                
                if (this.selectedCategoryItem == button) return;
                
                // Unselect previous
                this._activeSelection = null;
                this.selectedCategoryItem.GetComponentInChildren<Text>().fontStyle = FontStyle.Normal;
                this.selectedCategoryItem = button;
                
                // Select current
                button.Select();
                text.fontStyle = FontStyle.Bold;

                this.SelectCategory(category);
            });
            
            if (this.selectedCategoryItem == null) {
                // button.onClick.Invoke();
                // Unselect previous
                this.selectedCategoryItem = button;

                // Select current
                button.Select();
                text.fontStyle = FontStyle.Bold;

                this.SelectCategory(category);
            }

        }
    }

    
    public OnShow() {
        if (this.selectedCategoryItem.transform.GetSiblingIndex() == 0)
            this.categoryScroll.horizontalNormalizedPosition = this.selectedCategoryItem.transform.GetSiblingIndex();
    }
    

    
    /* ---------------------------------------------------------------------------------------------------- */

    private _isActive: boolean = false;
    private _owner: ZepetoCharacter;

    private readonly _originalItems = new Map<number, string>();
    private readonly _currentItems = new Map<number, string>();
    private readonly _itemChanged = new UnityEvent();

    public get isActive(): boolean {
        return this._isActive;
    }
    // public get checked(): IComponentBase {
    //     return this._isActive ? this : null;
    // }
    public get owner(): ZepetoCharacter {
        return this._owner;
    }
    public get originalItems(): Map<number, string> {
        return this._originalItems;
    }
    public get currentItems(): Map<number, string> {
        return this._currentItems;
    }
    public get itemChanged(): UnityEvent {
        return this._itemChanged;
    }
    
    /**
     * Inventory of user owned/worn products
     * @private
     */
    private inventory: InventoryRecord[] = null;

    /**
     * Load the user's inventory
     * @private
     */
    private *LoadInventory() {
        
        let request = InventoryService.GetListAsync();
        
        yield new WaitUntil(() => request.keepWaiting == false);
        
        if (request.responseData.isSuccess) {
            this.inventory = request.responseData.products;
        }
    }

    private InventoryHasItem(itemId: string) : boolean {
        for (let item of this.currentItems.values()) {
            if (item == "@" + itemId) return true;
        }
        return false;
    }

    public SetCharacterItem(propertyFlag: number, id: string, onItemLoaded?: UnityAction) {
        this._owner.Context.Metadata.Set(propertyFlag, id);
        this.RegisterCurrentItem(propertyFlag, id);

        this._itemChanged.Invoke();

        if (onItemLoaded) {
            this.StartCoroutine(this.CoWaitForMetadataSet(onItemLoaded));
        }
    }

    public SetCharacterItems(items: Item[], onItemsLoaded?: UnityAction) {
        for (const item of items) {
            this._owner.Context.Metadata.Set(item.property, "@" + item.id);
            this.RegisterCurrentItem(item.property, "@" + item.id);
        }

        this._itemChanged.Invoke();

        if (onItemsLoaded) {
            this.StartCoroutine(this.CoWaitForMetadataSet(onItemsLoaded));
        }
    }

    public ResetCharacterItems(onFinished?: Action) {
        if (this._originalItems.size < 1) {
            return;
        }
        this._originalItems.forEach((id, propertyFlag) => {
            this._owner.Context.Metadata.Set(propertyFlag, id);
            this.RegisterCurrentItem(propertyFlag, id);
        });

        if (onFinished) {
            this.StartCoroutine(this.CoWaitForMetadataSet(onFinished));
        }
    }
    
    public SetOriginalItem(propertyFlag: number, id: string) {
        this._originalItems.set(propertyFlag, id);
    }

    public RegisterCurrentItem(propertyFlag: number, id: string) {
        this._currentItems.set(propertyFlag, id);
    }

    public ClearCurrentItems() {
        this._currentItems.clear();
    }
    
    public InitOriginalItems() {
        for (let i = ZepetoPropertyFlag.ClothesTop; i <= ZepetoPropertyFlag.ClothesDress; ++i) {
            this.RegisterOriginalItemFromContext(i, this.owner.Context);
        }
        for (let i = ZepetoPropertyFlag.ClothesSocks; i <= ZepetoPropertyFlag.AccessoryPiercing; ++i) {
            this.RegisterOriginalItemFromContext(i, this.owner.Context);
        }
        for (let i = ZepetoPropertyFlag.AccessoryMask; i <= ZepetoPropertyFlag.ClothesExtra; ++i) {
            this.RegisterOriginalItemFromContext(i, this.owner.Context);
        }
        for (let i = ZepetoPropertyFlag.AccessoryTail; i <= ZepetoPropertyFlag.AccessoryEffect; ++i) {
            this.RegisterOriginalItemFromContext(i, this.owner.Context);
        }

        let additional = [ZepetoPropertyFlag.ClothesGlasses, ZepetoPropertyFlag.Hair, ZepetoPropertyFlag.EyeLens];
        for (let property of additional) {
            this.RegisterOriginalItemFromContext(property, this.owner.Context);
        }
        
        this._originalItems.forEach((id, propertyFlag) => this.RegisterCurrentItem(propertyFlag, id));
    }

    public UpdateCurrentItems() {
        this.ClearCurrentItems();
        
        for (let i = ZepetoPropertyFlag.ClothesTop; i <= ZepetoPropertyFlag.ClothesDress; ++i) {

            this._currentItems.set(i, this.owner.Context.Metadata.Get(i));
        }
        for (let i = ZepetoPropertyFlag.ClothesSocks; i <= ZepetoPropertyFlag.AccessoryPiercing; ++i) {
            this._currentItems.set(i, this.owner.Context.Metadata.Get(i));
        }
        for (let i = ZepetoPropertyFlag.AccessoryMask; i <= ZepetoPropertyFlag.ClothesExtra; ++i) {
            this._currentItems.set(i, this.owner.Context.Metadata.Get(i));
        }
        for (let i = ZepetoPropertyFlag.AccessoryTail; i <= ZepetoPropertyFlag.AccessoryEffect; ++i) {
            this._currentItems.set(i, this.owner.Context.Metadata.Get(i));
        }

        let additional = [ZepetoPropertyFlag.ClothesGlasses, ZepetoPropertyFlag.Hair, ZepetoPropertyFlag.EyeLens];
        for (let property of additional) {
            this._currentItems.set(property, this.owner.Context.Metadata.Get(property));
        }
    }
    
    private RegisterOriginalItemFromContext(propertyFlag: number, context: ZepetoContext) {
        this._originalItems.set(propertyFlag, context.Metadata.Get(propertyFlag));
    }

    /* ---------------------------------------------------------------------------------------------------- */

    /**
     *  Load my items
      */
    private *CoGetMyItem() {
        this.emptyListIndicator?.SetActive(false);
        
        // Cleanup
        // TODO: Reusable object cleanup
        for (let i = 0; i < this.itemCanvas.childCount; i++)
        {
            Object.Destroy(this.itemCanvas.GetChild(i).gameObject);
        }
        
        // TODO: Add categories title from a category response
        
        if (!this.cachedItems[this.itemCategory])
            this.cachedItems[this.itemCategory] = [];
        
        // Load contents
        if (this.cachedItems[this.itemCategory].length == 0) {

            let nextPageToken: string = null;

            while (true) {
                // Request the item list with the "all" keyword and no filters.
                var requestItemList = ShopService.GetMyContentItemListAsync(this.itemCategory, null);

                // Wait until the request is complete.
                yield new WaitUntil(() => requestItemList.keepWaiting == false);

                if (requestItemList.responseData.isSuccess) {
                    let contentItems: Item[] = requestItemList.responseData.items;
                    
                    this.cachedItems[this.itemCategory] = contentItems;

                    nextPageToken = requestItemList.responseData.nextPageToken;
                    
                } else {
                    // Error
                }

                if (nextPageToken == null)
                    break;
            }
        }
        
        // Instantiation
        let contentItems: Item[] = this.cachedItems[this.itemCategory];
        this.activeItems = this.cachedItems[this.itemCategory];

        this.emptyListIndicator?.SetActive(this.activeItems.length == 0);
        
        for (let i = 0; i < contentItems.length; ++i) {
          
            const item = Object.Instantiate(this.itemPrefab, this.itemCanvas) as GameObject;

            let itemController = item.GetComponentInChildren<WardrobeItemController>();
            
            let isFocused = this.InventoryHasItem(contentItems[i].id);
            if (isFocused)
                this._activeSelection = itemController;
            
            itemController.SetItem(contentItems[i], isFocused);
            
            
            itemController.button.onClick.AddListener(() => {
                
                if (itemController.isItemEquiped == false) {
                    this.SetCostume(contentItems[i]);
                }
                else {
                    let propertyFlag = contentItems[i].property;
                    let id: string = this._originalItems[propertyFlag];
                    
                    this.SetCharacterItem(propertyFlag, "", () => {
                        this.UpdateCurrentItems();
                        this.UpdateSelection();
                    });
                }
            });
        }
        
        // Force layout rebuild to ensure proper UI element positioning.
        const rect = this.itemCanvas.gameObject.GetComponent<RectTransform>();
        LayoutRebuilder.ForceRebuildLayoutImmediate(rect);
    }

    public SelectCategory(category: ItemKeyword) {
        this.itemCategory = category;
        this.StartCoroutine(this.CoGetMyItem());
    }

    /**
     * Equip the item to current character
     * @param item
     */
    private SetCostume(item: Item) {
        
        try {
            this.SetCharacterItem(item.property, "@" + item.id, () => {
                this.UpdateCurrentItems();
                this.UpdateSelection();
            });
        }
        catch (e) {
            console.log(e)
        }
    }

    /**
     * Updates the selection for all current items
     * @private
     */
    private UpdateSelection() {

        for (let i = 0; i < this.activeItems.length; ++i) {

            let item = this.activeItems[i];
            let controller = this.itemCanvas.GetChild(i).GetComponentInChildren<WardrobeItemController>();

            controller.SetSelected(this.InventoryHasItem(item.id));
        }
    }

    private *CoWaitForMetadataSet(onFinished: Action) {
        while (this._owner.Context.IsContentLoading) {
            yield null;
        }
        onFinished();
    }
}