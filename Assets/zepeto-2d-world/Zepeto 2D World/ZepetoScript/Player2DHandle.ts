import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Zepeto2DPlayer from './Zepeto2DPlayer';

export default class Player2DHandle extends ZepetoScriptBehaviour {
    /** Owner Zepeto2DPlayer (set by Zepeto2DPlayer when creating Hitbox2D) */
    public owner: Zepeto2DPlayer | null = null;

    /** Is this the local player's collider? (set by Zepeto2DPlayer) */
    public isLocal: boolean = false;
}