import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ShopService, ItemKeyword } from 'ZEPETO.Module.Shop';
import { ZepetoPropertyFlag } from 'Zepeto';
import { GameObject, Object, RectTransform, Texture2D, Transform, WaitUntil } from 'UnityEngine';
import { Button, LayoutRebuilder, RawImage, Text } from 'UnityEngine.UI';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { WorldService } from 'ZEPETO.World';
import { Item } from 'ZEPETO.Module.Content';

export default class WardrobeController extends ZepetoScriptBehaviour {

    public itemPrefab: GameObject;
    public itemCanvas: Transform;
    public itemCategory: ItemKeyword;
    
    // When the scene starts, create a player with the provided user ID and begin fetching and displaying the items.
    Start() {
        
        // Create a new player with the specified user ID.
        // ZepetoPlayers.instance.CreatePlayerWithUserId(WorldService.userId, new SpawnInfo(), true);

        // Add a listener to the OnAddedLocalPlayer event, which triggers when the local player is added.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            // Start the CoGetMyItem coroutine to fetch and display the items.
            this.StartCoroutine(this.CoGetMyItem());
        });
    }

    // Coroutine to fetch and display the items.
    *CoGetMyItem() {
        // Request the item list with the "all" keyword and no filters.
        var requestItemList = ShopService.GetMyContentItemListAsync(this.itemCategory, null);

        // Wait until the request is complete.
        yield new WaitUntil(() => requestItemList.keepWaiting == false);

        if (requestItemList.responseData.isSuccess) {
            let contentItems: Item[] = requestItemList.responseData.items;

            for (let i = 0; i < contentItems.length; ++i) {
                const property: ZepetoPropertyFlag = contentItems[i].property;

                // Request the thumbnail texture for the item.
                var textureReq = contentItems[i].GetThumbnailAsync();
                yield new WaitUntil(() => textureReq.keepWaiting == false);
                let thumbnailTexture: Texture2D = textureReq.responseData.texture;

                // Instantiate an item prefab and set its properties.
                const item = Object.Instantiate(this.itemPrefab, this.itemCanvas) as GameObject;
                item.GetComponentInChildren<RawImage>().texture = thumbnailTexture;
                item.GetComponentInChildren<Text>().text = contentItems[i].id;

                // Add a click listener to the item button to change the costume when clicked.
                item.GetComponentInChildren<Button>().onClick.AddListener(() => {
                    this.SetItemButton(contentItems[i].id);
                });
            }
        }

        // Force layout rebuild to ensure proper UI element positioning.
        const rect = this.itemCanvas.gameObject.GetComponent<RectTransform>();
        LayoutRebuilder.ForceRebuildLayoutImmediate(rect);
    }

    // Method to change the local player's costume based on the provided item code.
    SetItemButton(itemCode: string) {
        // Use the ZepetoPlayers.instance.LocalPlayer property to access the local player instance and change their costume.
        ZepetoPlayers.instance.LocalPlayer.SetCostume(itemCode, () => {
            // Once the costume change is complete, log a message indicating the successful change.
            console.log(`Set Costume Complete : ${itemCode}`);
        });
    }


    // /**
    //  * Item category.
    //  */
    // enum ItemKeyword {
    // /**
    //  * All
    //  */
    // all = 0,
    // /**
    //  * Hair
    //  */
    // hair = 1,
    // /**
    //  * Dress
    //  */
    // onepiece = 2,
    // /**
    //  * Top
    //  */
    // top = 3,
    // /**
    //  * All
    //  */
    // outwear = 4,
    // /**
    //  * Pants
    //  */
    // pants = 5,
    // /**
    //  * Skirt
    //  */
    // skirt = 6,
    // /**
    //  * Socks
    //  */
    // socks = 7,
    // /**
    //  * Footwear
    //  */
    // footwear = 8,
    // /**
    //  * Headwear
    //  */
    // headwear = 9,
    // /**
    //  * Eyewear
    //  */
    // eyewear = 10,
    // /**
    //  * Jewelry
    //  */
    // jewelry = 11,
    // /**
    //  * Makeup
    //  */
    // makeup = 12,
    // /**
    //  * Accessory
    //  */
    // accessory = 13,
    // /**
    //  * Body Type
    //  */
    // bodyfigure = 14,
    // /**
    //  * Special Bodysuit
    //  */
    // animal = 15,
    // /**
    //  * None
    //  */
    // none = 16 }
    
}