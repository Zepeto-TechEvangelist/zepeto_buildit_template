import { ZepetoInputControl } from "RootNamespace";
import {Quaternion, Vector2, Vector3, Input} from "UnityEngine";
import { CallbackContext } from "UnityEngine.InputSystem.InputAction";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { LocalPlayer, ZepetoPlayers, ZepetoPlayer } from "ZEPETO.Character.Controller";
import { UnityEvent, UnityEvent$1 } from "UnityEngine.Events";

/* Keyboard input */
export default class KeyboardControl extends ZepetoScriptBehaviour {
    private readonly _inputControl = new ZepetoInputControl();

    private _isMoving: boolean = false;
    private _moveDir: Vector3 = Vector3.zero;
    private _character: LocalPlayer = null;

    public get inputControl(): ZepetoInputControl {
        return this._inputControl;
    }
    public get isMoving(): boolean {
        return this._isMoving;
    }
    
    public OnStartMoving: UnityEvent;
    public OnMove: UnityEvent$1<Vector2>;
    public OnStopMoving: UnityEvent;


    Update() {
        if (!this._isMoving) {
            return;
        }
       
        const horizontalInput = Input.GetAxis("Horizontal");
        const verticalInput = Input.GetAxis("Vertical");

        this._moveDir.x = horizontalInput;
        this._moveDir.y = 0;
        this._moveDir.z = verticalInput;

        this.OnMove?.Invoke(new Vector2(horizontalInput, verticalInput));
    }

    public Init() {
        this._character = ZepetoPlayers.instance.LocalPlayer;
        this._inputControl.Enable();
        
        // Keyboard actions
        this._inputControl.UI.Navigate.started += this.StartMoving;
        this._inputControl.UI.Navigate.canceled += this.StopMoving;
        
        this.OnStartMoving ??= new UnityEvent();
        this.OnMove ??= new UnityEvent$1<Vector2>();
        this.OnStopMoving ??= new UnityEvent();
    }

    public Release() {
        
        this._inputControl.UI.Navigate.remove_started(this.StartMoving.bind(this));
        this._inputControl.UI.Navigate.remove_canceled(this.StopMoving.bind(this));
        
        this.OnStartMoving?.RemoveAllListeners();
        this.OnMove?.RemoveAllListeners();
        this.OnStopMoving?.RemoveAllListeners();
        
        this._character = null;
    }

    private StartMoving(context: CallbackContext) {
        this._isMoving = true;
        
        this.OnStartMoving?.Invoke();
    }

    private StopMoving(context: CallbackContext) {
        this._isMoving = false;
        this._moveDir.x = 0;
        this._moveDir.y = 0;
        this._moveDir.z = 0;

        this.OnStopMoving?.Invoke();
    }

    private SetMoveDirection(context: CallbackContext) {
        const dir: Vector2 = context.ReadValueAsObject() as Vector2;
        this._moveDir.x = dir.x;
        this._moveDir.y = 0;
        this._moveDir.z = dir.y;
        
    }

}