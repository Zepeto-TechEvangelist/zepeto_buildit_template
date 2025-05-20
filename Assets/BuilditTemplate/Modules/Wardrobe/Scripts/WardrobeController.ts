import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {ItemKeyword, ShopService} from 'ZEPETO.Module.Shop';
import {FontStyle, GameObject, Object, RectTransform, Transform, WaitUntil} from 'UnityEngine';
import {Button, LayoutRebuilder, ScrollRect, Text} from 'UnityEngine.UI';
import {ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {Item} from 'ZEPETO.Module.Content';
import UIMenuController from './UIMenuController';
import WardrobeItemController from './WardrobeItemController';
import {InventoryRecord, InventoryService} from 'ZEPETO.Inventory';


export default class WardrobeController extends ZepetoScriptBehaviour {
    
    
    public menu: UIMenuController;
    public isInventory: boolean = true;
    
    
    public itemPrefab: GameObject;
    
    public itemCanvas: Transform;
    public itemCategory: ItemKeyword;


    public categoryScroll: ScrollRect;
    public categoryPrefab: GameObject;
    public categoryCanvas: Transform;
    
    public cachedItems: Map<ItemKeyword, Item[]> = new Map<ItemKeyword, Item[]>();
    
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
        ItemKeyword.makeup,
        ItemKeyword.hair,
        // ItemKeyword.bodyfigure
    ];
    
    
    // When the scene starts, create a player with the provided user ID and begin fetching and displaying the items.
    Start() {
        
        // Hide the prefabs
        for (var i = 0; i < this.categories.length; i++)
            this.cachedItems.set(this.categories[i], []);
        
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            // this.StartCoroutine(this.LoadInventory());   // disabled currently
            this.StartCoroutine(this.CoGetMyItem());
        });
        
        this.StartCoroutine(this.CreateCategoryMenu());
        
        this.menu ??= this.GetComponent<UIMenuController>();
        this.menu.onOpened.AddListener(() => {
            this.OnShow();
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
            "Makeup",
            "Hair",
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
            
            console.log( this.inventory.flatMap(x => x.productId).join(",") );
        }
    }
    
    private InventoryHasItem(itemId: string) : boolean {
        return this.inventory.findIndex(x => x.productId == itemId) != -1;
    }
    
    // Coroutine to fetch and display the items.
    private *CoGetMyItem() {
        
        // CleanupI
        for (let i = 0; i < this.itemCanvas.childCount; i++)
        {
            Object.Destroy(this.itemCanvas.GetChild(i).gameObject);
        }
        // Maybe loading
        
        // TODO: Add categories title from a category response
        
        if (!this.cachedItems[this.itemCategory])
            this.cachedItems[this.itemCategory] = [];
        
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

        let contentItems: Item[] = this.cachedItems[this.itemCategory];
        
        for (let i = 0; i < contentItems.length; ++i) {
          
            const item = Object.Instantiate(this.itemPrefab, this.itemCanvas) as GameObject;

            let itemController = item.GetComponentInChildren<WardrobeItemController>();
            itemController.SetItem(contentItems[i], false);
            
            item.GetComponentInChildren<Button>().onClick.AddListener(() => {
                // itemController.SetSelectedState(true);
                this.SetItemButton(contentItems[i].id);
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
    
    // Method to change the local player's costume based on the provided item code.
    private SetItemButton(itemCode: string) {
        // Use the ZepetoPlayers.instance.LocalPlayer property to access the local player instance and change their costume.
        
        ZepetoPlayers.instance.LocalPlayer.SetCostume(itemCode, () => {
            // Once the costume change is complete, log a message indicating the successful change.
            // console.log(`Set Costume Complete : ${itemCode}`);
            // TODO: Additional item code etc
        });
    }



    // private AddMessageHandler(){
    //     // [Option] Synchronize each player's clothes
    //     this._room.AddMessageHandler<ChangedItem>(this.MESSAGE_TYPE.SyncChangedItem, message => {
    //         console.log("syncChangedItem");
    //         if (message == null) {
    //             return;
    //         }
    //
    //         if(false == this._userZepetoContexts.has(message.sessionId)){
    //             return;
    //         }
    //
    //         let itemContents:ItemContent[] = [];
    //
    //         for (const characterItem of message.characterItems) {
    //             let itemContent:ItemContent = new ItemContent();
    //             itemContent.id = characterItem.id;
    //             itemContent.property = parseInt(characterItem.property);
    //
    //             if(itemContent.id == this._basicClothString)
    //                 itemContent.id = "";
    //
    //             itemContents.push(itemContent);
    //         }
    //         let clothesPreviewer:ClothesPreviewer = new ClothesPreviewer(this._userZepetoContexts.get(message.sessionId),itemContents);
    //         clothesPreviewer.PreviewContents();
    //     });
    // }
}