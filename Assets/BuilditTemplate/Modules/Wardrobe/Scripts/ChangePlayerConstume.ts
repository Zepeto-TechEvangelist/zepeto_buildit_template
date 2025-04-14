import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { WorldService } from 'ZEPETO.World';


import { ShopService, ItemKeyword } from 'ZEPETO.Module.Shop';
import { ZepetoPropertyFlag } from 'Zepeto';
import { GameObject, Object, RectTransform, Texture2D, Transform, WaitUntil } from 'UnityEngine';
import { Button, LayoutRebuilder, RawImage, Text } from 'UnityEngine.UI';
import { Item } from 'ZEPETO.Module.Content';


export default class ChangeLocalPlayerCostume extends ZepetoScriptBehaviour {

    public itemCode: string;

    // When the scene starts, create a player with the provided user ID and change their costume.
    Start() {

        // Create a new player with the specified user ID.
        // ZepetoPlayers.instance.CreatePlayerWithUserId(WorldService.userId, new SpawnInfo(), true);

        // Add a listener to the OnAddedLocalPlayer event, which triggers when the local player is added.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {

            // Call the ChangeCostume method with the provided item code to change the costume.
            // this.ChangeCostume(this.itemCode);
            this.StartCoroutine(this.CoGetMyItem());
        });
    }

    // Method to change the costume of the local player using the provided item code.
    ChangeCostume(itemCode: string) {

        // Use the LocalPlayer property to access the local player instance and set their costume using the provided item code.
        ZepetoPlayers.instance.LocalPlayer.SetCostume(itemCode, () => {
            // Once the costume change is complete, log a message indicating the successful change.
            console.log(`Set Costume Complete : ${itemCode}`);
        });
    }


    // Coroutine to fetch and display the items.
    *CoGetMyItem() {
        // Request the item list with the "all" keyword and no filters.
        var requestItemList = ShopService.GetMyContentItemListAsync(ItemKeyword.all, null);

        // Wait until the request is complete.
        yield new WaitUntil(() => requestItemList.keepWaiting == false);

        if (requestItemList.responseData.isSuccess) {
            let contentItems: Item[] = requestItemList.responseData.items;

            console.log(`Retrieved item list ${contentItems.length} items`);
            console.log(contentItems.flatMap(x => x.id).join(", "));    // print the item list

            this.itemCode = contentItems[0].id;
            this.ChangeCostume(this.itemCode);
            
            // for (let i = 0; i < contentItems.length; ++i) {
            //     const property: ZepetoPropertyFlag = contentItems[i].property;
            //
            //     // Request the thumbnail texture for the item.
            //     var textureReq = contentItems[i].GetThumbnailAsync();
            //     yield new WaitUntil(() => textureReq.keepWaiting == false);
            //     let thumbnailTexture: Texture2D = textureReq.responseData.texture;
            //
            //     // Instantiate an item prefab and set its properties.
            //     const item = Object.Instantiate(this.itemPrefab, this.itemCanvas) as GameObject;
            //     item.GetComponentInChildren<RawImage>().texture = thumbnailTexture;
            //     item.GetComponentInChildren<Text>().text = contentItems[i].id;
            //
            //     // Add a click listener to the item button to change the costume when clicked.
            //     item.GetComponentInChildren<Button>().onClick.AddListener(() => {
            //         this.SetItemButton(contentItems[i].id);
            //     });
            // }
        }

        // Force layout rebuild to ensure proper UI element positioning.
        // const rect = this.itemCanvas.gameObject.GetComponent<RectTransform>();
        // LayoutRebuilder.ForceRebuildLayoutImmediate(rect);
    }
}


// export default class CheckMyItemList extends ZepetoScriptBehaviour {
//
//     public itemPrefab: GameObject;
//     public itemCanvas: Transform;
//
//     // When the scene starts, create a player with the provided user ID and begin fetching and displaying the items.
//     Start() {
//         // Create a new player with the specified user ID.
//         ZepetoPlayers.instance.CreatePlayerWithUserId(WorldService.userId, new SpawnInfo(), true);
//
//         // Add a listener to the OnAddedLocalPlayer event, which triggers when the local player is added.
//         ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
//             // Start the CoGetMyItem coroutine to fetch and display the items.
//             this.StartCoroutine(this.CoGetMyItem());
//         });
//     }
//
    
//
//     // Method to change the local player's costume based on the provided item code.
//     SetItemButton(itemCode: string) {
//         // Use the ZepetoPlayers.instance.LocalPlayer property to access the local player instance and change their costume.
//         ZepetoPlayers.instance.LocalPlayer.SetCostume(itemCode, () => {
//             // Once the costume change is complete, log a message indicating the successful change.
//             console.log(`Set Costume Complete : ${itemCode}`);
//         });
//     }
//
// }