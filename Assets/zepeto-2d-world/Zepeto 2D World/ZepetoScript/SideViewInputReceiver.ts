import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    GameObject, Input, KeyCode, Vector2, Mathf, WaitForEndOfFrame, Time
} from 'UnityEngine';
import { ZepetoPlayers, ZepetoPlayer } from 'ZEPETO.Character.Controller';
import ZepetoScreenTouchpad from './ZepetoScreenTouchpad';
import Zepeto2DPlayer from './Zepeto2DPlayer';

export default class SideViewInputReceiver extends ZepetoScriptBehaviour {
    public touchpadObj: GameObject | null = null;
    private touchpad: ZepetoScreenTouchpad | null = null;

    private player: Zepeto2DPlayer | null = null;
    private boundSessionId: string | null = null;
    private isBinding: boolean = false;

    public useKeyboardFallback: boolean = true;
    public invertY: boolean = false;

    Start() {
        if (this.touchpadObj) this.touchpad = this.touchpadObj.GetComponent<ZepetoScreenTouchpad>();
        if (!this.touchpad) this.touchpad = GameObject.FindObjectOfType<ZepetoScreenTouchpad>() as ZepetoScreenTouchpad;

        ZepetoPlayers.instance.OnAddedPlayer.AddListener(this.OnAddedPlayer);
        ZepetoPlayers.instance.OnRemovedPlayer.AddListener(this.OnRemovedPlayer);
    }

    OnDestroy() {
        ZepetoPlayers.instance?.OnAddedPlayer.RemoveListener(this.OnAddedPlayer);
        ZepetoPlayers.instance?.OnRemovedPlayer.RemoveListener(this.OnRemovedPlayer);
    }

    // --- Player events --------------------------------------------------------

    private OnAddedPlayer = (sessionId: string) => {
        // 이미 바인딩 되어있으면 무시
        if (this.boundSessionId) return;

        const player = ZepetoPlayers.instance.GetPlayer(sessionId);
        if (player && player.isLocalPlayer) {
            this.TryBind(sessionId);
        }
    };

    private OnRemovedPlayer = (sessionId: string) => {
        if (this.boundSessionId === sessionId) {
            this.player = null;
            this.boundSessionId = null;
            this.isBinding = false;
        }
    };

    private TryBind(sessionId: string) {
        if (this.boundSessionId || this.isBinding) return;
        this.StartCoroutine(this.BindWhenReady(sessionId));
    }

    private *BindWhenReady(sessionId: string): IterableIterator<any> {
        this.isBinding = true;

        const start = Time.time;
        const timeout = 5.0;

        // Wait until ZepetoPlayer + character exist
        let zp: ZepetoPlayer | null = null;
        while (Time.time - start < timeout) {
            zp = ZepetoPlayers.instance.GetPlayer(sessionId);
            if (zp && zp.character) break;
            yield null;
        }
        if (!zp || !zp.character) { this.isBinding = false; return; }

        // Wait until Zepeto2DPlayer is attached
        let ctrl: Zepeto2DPlayer | null = null;
        while (Time.time - start < timeout) {
            ctrl = zp.character.GetComponent<Zepeto2DPlayer>() as Zepeto2DPlayer;
            if (ctrl) break;
            yield new WaitForEndOfFrame();
        }
        if (!ctrl) { this.isBinding = false; return; }

        this.player = ctrl;
        if(this.player.player2dHandle) this.player.player2dHandle.isLocal = true;
        this.boundSessionId = sessionId;
        this.player.ApplyInput(Vector2.zero);
        this.isBinding = false;

        console.log(`<color=yellow>[InputReceiver]</color> Bound to local player ${sessionId}`);
    }

    // --- Input loop -----------------------------------------------------------

    Update() {
        if (!this.player) return;

        let dir = Vector2.zero;
        let hasInput = false;

        // Touch first
        if (this.touchpad && this.touchpad.IsTouching()) {
            dir = this.touchpad.GetAxis();
            hasInput = true;
        }

        // Keyboard fallback
        if (!hasInput && this.useKeyboardFallback) {
            let x = 0, y = 0;
            if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D)) x += 1;
            if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A)) x -= 1;
            if (Input.GetKey(KeyCode.UpArrow) || Input.GetKey(KeyCode.W)) y += 1;
            if (Input.GetKey(KeyCode.DownArrow) || Input.GetKey(KeyCode.S)) y -= 1;
            dir = new Vector2(x, this.invertY ? -y : y);
        }

        this.player.ApplyInput(dir);
    }

    OnApplicationFocus(focused: boolean) {
        if (!focused && this.player) this.player.ApplyInput(Vector2.zero);
    }

    OnDisable() {
        if (this.player) this.player.ApplyInput(Vector2.zero);
    }
}
