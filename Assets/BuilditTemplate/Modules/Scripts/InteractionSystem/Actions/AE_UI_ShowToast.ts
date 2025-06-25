import { ActionBase } from "../ActionBase";
import { PopupCommon, PopupCommonBuilder, ZepetoToast } from 'ZEPETO.World.Gui';
import { Type } from 'ZEPETO.World.Gui.ZepetoToast';

export default class AE_UI_ShowToast extends ActionBase {
    public isLocalized: boolean;
    public message: string;
    @HideInInspector() public toastType: Type = Type.None;
    
    public Init() {
        
    }
    
    override DoAction(): void {
        ZepetoToast.Show(Type.None, this.message);
    }
}