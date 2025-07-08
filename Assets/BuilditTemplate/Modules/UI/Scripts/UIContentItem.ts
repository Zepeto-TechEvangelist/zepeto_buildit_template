import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {Button} from "UnityEngine.UI";
import {Object} from "UnityEngine";
import {RoundedRectangle} from "ZEPETO.World.Gui";

/**
 * Represents content such as list items
 */
export default class UIContentItem extends ZepetoScriptBehaviour {

    public index: number;

    public item: Object;
    
    /**
     * Is the current item equiped
     */
    public selected: boolean;

    public SetSelected(selected: boolean) {
        this.selected = selected;

        if ( selected )
            this.outline.BorderWidth = 1;
        else {
            this.outline.BorderWidth = 0;
        }
    }

    /**
     * UI context - button
     */
    public button: Button;

    /**
     * UI context - outline
     */
    public outline: RoundedRectangle;

}