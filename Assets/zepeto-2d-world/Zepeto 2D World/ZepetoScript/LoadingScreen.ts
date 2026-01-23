// LoadingScreen.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { GameObject, Time, WaitForSeconds, Canvas } from 'UnityEngine';
import { ZepetoPlayers, ZepetoPlayer } from 'ZEPETO.Character.Controller';

export default class LoadingScreen extends ZepetoScriptBehaviour {
    
    public loadingScreenRoot: GameObject | null = null;
    public delayAfterReady: number = 0.1;
    
    private _isHiding: boolean = false;

    Start() {
        // Default to self if not assigned
        if (!this.loadingScreenRoot) {
            this.loadingScreenRoot = this.gameObject;
        }
        
        // Wait for local player to be ready
        const zp = ZepetoPlayers.instance;
        if (zp) {
            zp.OnAddedPlayer.AddListener((sessionId: string) => {
                const player = zp.GetPlayer(sessionId);
                if (player && player.isLocalPlayer) {
                    this.StartCoroutine(this.WaitAndHide(player));
                }
            });
        }
        
        // Enable at start
        this.loadingScreenRoot.GetComponent<Canvas>().enabled = true;
    }

    /** Wait until character is fully ready, then hide the loading screen. */
    private *WaitAndHide(player: ZepetoPlayer): IterableIterator<any> {
        if (this._isHiding) return;
        this._isHiding = true;
        
        // Wait for character to be fully loaded (max 10s timeout)
        const startTime = Time.time;
        const timeout = 10;
        
        while (Time.time - startTime < timeout) {
            if (player && player.character && player.character.gameObject.activeSelf) {
                break;
            }
            yield null;
        }
        
        // Extra delay after character is ready
        yield new WaitForSeconds(this.delayAfterReady);
        
        // Disable loading screen
        if (this.loadingScreenRoot) {
            this.loadingScreenRoot.SetActive(false);
        }
    }

    /** Manual hide (can be called externally if needed). */
    public Hide() {
        if (this._isHiding || !this.loadingScreenRoot) return;
        this._isHiding = true;
        this.loadingScreenRoot.SetActive(false);
    }
}

