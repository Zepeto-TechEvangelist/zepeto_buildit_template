import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {ItemKeyword, ShopService} from 'ZEPETO.Module.Shop';
import {ZepetoPropertyFlag} from 'Zepeto';
import {GameObject, Vector3, Object, RectTransform, Texture2D, Transform, WaitUntil, FontStyle, Coroutine} from 'UnityEngine';
import {Button, RawImage, Text} from 'UnityEngine.UI';
import {ZepetoPlayers, ZepetoCamera} from 'ZEPETO.Character.Controller';
import {Item} from 'ZEPETO.Module.Content';

import { InventoryService, InventoryListResponse, CheckInventoryResponse, CheckInventoryRequest, InventoryError, InventoryRecord, InventoryResponse } from 'ZEPETO.Inventory';
import { RoundedRectangle } from 'ZEPETO.World.Gui';

export default class WardrobeItemController extends ZepetoScriptBehaviour {

    /**
     * The data item
     */
    public item: Item;

    /**
     * Is the current item equiped
     */
    public isItemEquiped: boolean;

    /**
     * UI context - button
     */
    public button: Button;

    /**
     * UI context - outline
     */
    public outline: RoundedRectangle;
    
    /**
     * UI context - image
     */
    public image: RawImage;

    /**
     * UI context - text
     */
    public text: Text;
    
    /**
     * LoadingItemData Success - callback function
     */
    public OnLoadingFinished: (item: WardrobeItemController) => void = null;
    
    
    Start() {
        this.image ??= this.GetComponentInChildren<RawImage>();
        this.text ??= this.GetComponentInChildren<Text>();
        this.button ??= this.GetComponent<Button>();
    }
    
    private _loadItemDataOperation: Coroutine;
    
    public SetItem(item: Item, isEquiped: boolean = false) {
        if (this.item.id == item.id) 
            return;
        
        this.Reset();
        
        this.item = item;
        this.isItemEquiped = isEquiped;
        
        this._loadItemDataOperation = this.StartCoroutine(this.LoadItemData(item));
    }
    
    private Reset() {
        this.StopAllCoroutines();   // Can be exclusive to this coroutine
        this.image.texture = null;
        this.text.text = "";
    }
    
    // Coroutine to fetch and display the items.
    private *LoadItemData(item: Item) {

        const property: ZepetoPropertyFlag = item.property;
        
        // Request the thumbnail texture for the item.
        var textureReq = item.GetThumbnailAsync();
        yield new WaitUntil(() => textureReq.keepWaiting == false);
        let thumbnailTexture: Texture2D = textureReq.responseData.texture;
        
        this.image.texture = thumbnailTexture;
        this.text.text = item.id;
        
        this.SetSelectedState(this.isItemEquiped);
        
        if (this.OnLoadingFinished != null)
            this.OnLoadingFinished(this);
        
        let request = InventoryService.HasAsync(this.item.id);
        yield new WaitUntil(() => request.keepWaiting == false);

        if (this.isItemEquiped == false)
            this.SetSelectedState(request.responseData.isSuccess && request.responseData.isExist);
    }
    
    public SetSelectedState(selected: boolean) {
        if ( selected )
            this.outline.BorderWidth = 2;
        else {
            this.outline.BorderWidth = 0;
        }
    }

}