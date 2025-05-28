import {ZepetoScriptBehaviour} from 'ZEPETO.Script';
import {ItemKeyword, ShopService} from 'ZEPETO.Module.Shop';
import {ZepetoPropertyFlag} from 'Zepeto';
import {GameObject, Vector3, Object, RectTransform, Texture2D, Transform, WaitUntil, Coroutine} from 'UnityEngine';
import {Button, RawImage, Text } from 'UnityEngine.UI';
import {Item} from 'ZEPETO.Module.Content';
import {RoundedRectangle} from 'ZEPETO.World.Gui';

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
    
    
    private Start() {
        this.image ??= this.GetComponentInChildren<RawImage>();
        this.text ??= this.GetComponentInChildren<Text>();
        this.button ??= this.GetComponent<Button>();
        this.outline ??= this.GetComponent<RoundedRectangle>();
    }
    
    public SetItem(item: Item, isEquiped: boolean = false) {
        if (this.item.id == item.id) 
            return;
        
        this.Reset();
        
        this.item = item;
        this.isItemEquiped = isEquiped;
        
        this._loadItemDataOperation = this.StartCoroutine(this.LoadItemData(item));
    }

    public SetSelected(selected: boolean) {
        this.isItemEquiped = selected;
        
        if ( selected )
            this.outline.BorderWidth = 1;
        else {
            this.outline.BorderWidth = 0;
        }
    }
    
    public Reset() {
        this.StopAllCoroutines();
        this.image.texture = null;
        this.text.text = "";
    }

    /**
     * Coroutine instance associated with LoadItemData
     * @private
     */
    private _loadItemDataOperation: Coroutine;
    // Coroutine to fetch and display the items.
    private *LoadItemData(item: Item) {

        const property: ZepetoPropertyFlag = item.property;
        
        // Request the thumbnail texture for the item.
        var textureReq = item.GetThumbnailAsync();
        yield new WaitUntil(() => textureReq.keepWaiting == false);
        let thumbnailTexture: Texture2D = textureReq.responseData.texture;
        
        this.image.texture = thumbnailTexture;
        this.text.text = item.id;
        
        this.SetSelected(this.isItemEquiped);
        
        if (this.OnLoadingFinished != null)
            this.OnLoadingFinished(this);
    }
    
}