import { Collider, Vector3, Transform, Animator } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import TrapManager from './TrapManager';
import { Checkpoint } from './Checkpoint';
import PlayerTrigger, { PlayerTriggerInterface, ZepetoCharacterType} from '../../../Modules/Scripts/PlayerTrigger';

export default class CheckpointPlatformScript extends ZepetoScriptBehaviour implements PlayerTriggerInterface {
    

    @Tooltip("Index of the Checkpoint as a sequence")
    public index: int;
    
    public isActive: boolean = false;
    
    @Tooltip("Enabling will restrict this checkpoint to only one visit, Disabling it means it can be revisited")
    @HideInInspector()
    public singleUseOnly: boolean = false;
    
    // Whether the checkpoint has been visited.
    private visited: bool = false;
    
    private _animator: Animator;
    
    private static ActivePlatform: CheckpointPlatformScript = null;

    //@Header("Animation")
    @Tooltip("Is animation enabled")
    @HideInInspector() public animationEnabled: boolean = true;
    @Tooltip("Animation trigger mapped to the activation sequence")
    @HideInInspector() public animationTrigger: string = "activate";
    
    Awake() {
        TrapManager.instance;   // Autogenerate if missing
    }

    Start() {
        this.GetComponentInChildren<PlayerTrigger>().delegate = this;
        this._animator = this.GetComponentInChildren<Animator>();
        
        if (!this._animator)
            this.animationEnabled = false;
        else
            this.animationEnabled = true;
        // else
        //     this._animator.enabled = this.animationEnabled;
    }
    
    public Activate() {
        if (this.isActive)
            return;
        
        CheckpointPlatformScript.ActivePlatform?.Deactivate();
        CheckpointPlatformScript.ActivePlatform = this;
    
        this.isActive = true;
        this.visited = true;
        
        TrapManager.instance.VisitCheckpoint(new Checkpoint(this.index, this.transform.position));
        
        if (this.animationEnabled)
            this._animator?.SetTrigger(this.animationTrigger);
    }
    
    public Deactivate() {
        if (this.isActive == false) 
            return;
        
        this.isActive = false;
        
        if (this.animationEnabled)
            this._animator?.ResetTrigger(this.animationTrigger);
    }


    OnPlayerEnter(character: ZepetoCharacter, type: ZepetoCharacterType) {
        if (this.singleUseOnly && this.visited)
            return;

        this.Activate();
    }
    
    OnPlayerStay(character: ZepetoCharacter, type: ZepetoCharacterType) {
        // Intentionally left empty
    }
    OnPlayerExit(character: ZepetoCharacter, type: ZepetoCharacterType) {
        // Intentionally left empty
        // this.Deactivate();
    }
}
