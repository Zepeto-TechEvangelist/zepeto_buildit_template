import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import {
    CharacterMoveState,
    CharacterState, CustomMotionData,
    KnowSockets,
    SpawnInfo,
    ZepetoCharacter,
    ZepetoCharacterCreator,
    ZepetoPlayers
} from 'ZEPETO.Character.Controller';
import {Coroutine, Canvas, Camera, Quaternion, Vector2, Vector3, Object, GameObject, BoxCollider, Collider, Random, AnimationClip, WaitForSeconds, Time, WaitForEndOfFrame, Bounds} from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import PlayerTrigger, { IPlayerTrigger } from "../../Scripts/PlayerTrigger";


export default class NPCManager extends ZepetoScriptBehaviour implements IPlayerTrigger {

    // ZEPETO ID of the NPC
    @SerializeField()
    private zepetoId: string = "zepeto";


    @Header("Dialogue")

    @SerializeField()
    @Tooltip("Master switch for enablind dialogue speech bubble")
    private hasSpeechBubble: bool = true;

    @SerializeField()
    private speechBubbleText: string[];

    @Tooltip("Enable random order for speech bubble rather than sequential")
    public randomizeDialogue: bool = true;

    @Tooltip("Duration for each speech bubble text")
    public speechBubbleTextDuration: float = 5;

    private _dialogueIndex: int = 0;


    // Prefab of the speech bubble canvas game object
    @SerializeField()
    private speechBubblePrefab: GameObject;

    // y-axis offset value of the speech bubble canvas game object
    @SerializeField()
    private speechBubbleYOffset: number;

    private _speechBubbleActive : boolean = false;

    // Local character object
    private _zepetoCharacter: ZepetoCharacter;
    // NPC character object
    private _npc: ZepetoCharacter;
    // Speech bubble canvas game object
    private _speechBubbleObject: GameObject;
    // Text inside the speech bubble canvas game object
    private _speechBubbleText: Text;
    // Speech bubble canvas
    private _canvas: Canvas;
    // World Camera
    private _cachedWorldCamera: Camera;

    private _gestureCoroutine?: Coroutine;
    private _moveCoroutine?: Coroutine;



    @Header("Animations")

    @Tooltip("Animation played while showing a speech bubble, if multiple animations are set each text will corespond to the animation with same index.")
    public dialogueAnimations: AnimationClip[];

    @Tooltip("Animation played while standing still, only available if enableMovement is false")
    public idleAnimation: AnimationClip;



    @Header("Movement")

    @Tooltip("Enable or disable player movement")
    public enableMovement = true;

    @Tooltip("NPC movement area is determined by the Box Collider. Adjust it's Size and Position to customize the area.")
    public movementArea: BoxCollider;

    private _moveArea: Bounds;

    @Tooltip("Opposite direction movement area")
    @HideInInspector() public minMoveDistance: Vector2;

    @Tooltip("Forward direction movement area")
    @HideInInspector() public maxMoveDistance: Vector2;

    @Tooltip("Minimum idle time after movement")
    public minIdleTime: float;

    @Tooltip("Maximum idle time after movement")
    public maxIdleTime: float;

    private _initialPosition: Vector3;
    private _initialRotation: Quaternion;
    private _currentPosition: Vector3;

    private enableTeleport = true;
    private debug: boolean = false;
    
    Awake() {

        if (this.speechBubbleTextDuration < .5)
            this.speechBubbleTextDuration = .5;

        this._initialPosition = this.transform.position;
        this._initialRotation = this.transform.rotation;
        
        this.dialogueAnimations ??= [];

        if (this.movementArea) {
            const box = this.movementArea.bounds;

            this.minMoveDistance = new Vector2(box.center.x - box.size.x / 2, box.center.z - box.size.z / 2);
            this.maxMoveDistance = new Vector2(box.center.x + box.size.x / 2, box.center.z + box.size.z / 2);

            // 2D comparison for bounds
            if (false == box.Contains( this.transform.position )) {
                this._initialPosition = box.center;
            }

            this._moveArea = this.movementArea.bounds;
        }
        else
            this.enableMovement = false;

        // Cleanup
        let box = this.GetComponent<BoxCollider>();
        if (this.movementArea == box)
            this.movementArea = null;
        Object.Destroy(box);
    }

    Start() {
        const spawnInfo = new SpawnInfo();
        spawnInfo.position = this._initialPosition;
        spawnInfo.rotation = this._initialRotation;

        ZepetoCharacterCreator.CreateByZepetoId(this.zepetoId, spawnInfo,
            (character: ZepetoCharacter) => {

                this._npc = character;

                this.transform.SetParent(this._npc.transform);
                this.transform.localPosition = Vector3.zero;
                this.transform.localRotation = Quaternion.identity;

                if (this.hasSpeechBubble) {
                    this.InstantiateSpeechBubble();
                    this.GetComponent<PlayerTrigger>().delegate = this;
                }

                this.StartMoving();
            })
    }


    OnPlayerEnter() {
        if (this._speechBubbleActive) return;   // single lock
        this._speechBubbleActive = true;

        this._speechBubbleObject.SetActive(true);

        this.StopMoving();

        this.StartGesture();
    }

    OnPlayerExit() {
        this._speechBubbleActive = false;
        this._speechBubbleObject.SetActive(false);

        this.StopGesture();

        this.StartMoving()
    }


    InstantiateSpeechBubble() {
        if (this._speechBubbleObject)
            return;

        // Dynamically create the speech bubble canvas game object
        this._speechBubbleObject = Object.Instantiate(this.speechBubblePrefab) as GameObject;

        // Set the parent of the  speech bubble canvas game object transform to be the NPC transform.
        this._speechBubbleObject.transform.SetParent(this._npc.transform);

        // Set the position of the speech bubble canvas game object above the NPC's head
        this._speechBubbleObject.transform.position = Vector3.op_Addition(this._npc.GetSocket(KnowSockets.HEAD_UPPER).position, new Vector3(0, this.speechBubbleYOffset,0));

        // Set the text inside the speech bubble
        this._speechBubbleText = this._speechBubbleObject.GetComponentInChildren<Text>();

        this._canvas = this._speechBubbleObject.GetComponent<Canvas>();
        this._cachedWorldCamera ??= ZepetoPlayers.instance.ZepetoCamera.camera;
        this._canvas.worldCamera = this._cachedWorldCamera;
        this._speechBubbleObject.SetActive(false);
    }

    SetDialogue() {
        if (false == this._speechBubbleActive)
            return;

        if (this.speechBubbleText.length == 0)
            return;

        let textIndex: number;
        
        if (this.randomizeDialogue) {
            textIndex = Math.floor(Random.Range(0, this.speechBubbleText.length));
        }
        else {
            textIndex = this._dialogueIndex;
            
            this._dialogueIndex++;
            this._dialogueIndex %= this.speechBubbleText.length;
        }

        this._npc.CancelGesture();

        this._speechBubbleText.text = this.speechBubbleText[textIndex];
        
        // Check for coresponding animation
        if (this.dialogueAnimations.length > textIndex)
            this._npc.SetGesture(this.dialogueAnimations[textIndex]);
        else if (this.dialogueAnimations.length > 0)
            this._npc.SetGesture(this.dialogueAnimations[0]);
    }


    private *DialogueSequencer() {
        while (this._speechBubbleActive) {
            this.SetDialogue()
            yield new WaitForSeconds(this.speechBubbleTextDuration);
        }
    }

    private StartGesture() {
        if (this._gestureCoroutine == null)
            this._gestureCoroutine = this.StartCoroutine(this.DialogueSequencer());
    }

    private StartMoving() {
        if (false == this.enableMovement) {
            this._npc.CancelGesture();
            this._npc.SetGesture(this.idleAnimation);
        }
        else if (this._moveCoroutine == null)
            this._moveCoroutine = this.StartCoroutine(this.MoveStep());
    }

    private StopGesture() {
        if (this._gestureCoroutine)
            this.StopCoroutine(this._gestureCoroutine);
        this._gestureCoroutine = null;
        this._npc.CancelGesture();
    }

    private StopMoving() {
        if (this._moveCoroutine)
            this.StopCoroutine(this._moveCoroutine);
        this._moveCoroutine = null;
        this._npc.StopMoving();
    }

    private *MoveStep() {
        const t_bounds_timeout = 0.25;
        const t_max_move_timeout = 5;

        let CheckBounds = (pos: &Vector3, box: &Bounds) => {
            if (box.min.y - pos.y > 3) return -1;
            pos.y = box.center.y;
            return box.Contains(pos) ? 1 : 0;
        };
        
        while (this._speechBubbleActive == false) {
            
            if (this.debug) {

                const x = this._moveArea.min.x + Math.random() * (this._moveArea.max.x - this._moveArea.min.x);
                const z = this._moveArea.min.z + Math.random() * (this._moveArea.max.z - this._moveArea.min.z);
                const y = this._npc.transform.position.y;
                // const x1 = this._moveArea.min.x;
                // const z1 = this._moveArea.min.z;
                // const x2 = this._moveArea.max.x;
                // const z2 = this._moveArea.max.z;
                // const c1 = new Vector3(x1, y, z1);
                // const c2 = new Vector3(x1, y, z2);
                // const c3 = new Vector3(x2, y, z2);
                // const c4 = new Vector3(x2, y, z1);

                const start = this._npc.transform.position;
                const end = new Vector3(x, y, z);
               
                this._npc.CancelGesture();

                this._npc.Teleport( end , Quaternion.identity );
                yield new WaitForSeconds(0.2);
                
                continue;    
            }
            
            const idleTime = this.minIdleTime + Math.random() * (this.maxIdleTime - this.minIdleTime);

            const x = this._moveArea.min.x + Math.random() * (this._moveArea.max.x - this._moveArea.min.x);
            const z = this._moveArea.min.z + Math.random() * (this._moveArea.max.z - this._moveArea.min.z);
            const y = this._npc.transform.position.y;

            const start = this._npc.transform.position;
            const end = new Vector3(x, y, z);
            const step = 0.3;

            
            const direction = (end - start).normalized * step;
            
            let t_max_move = t_max_move_timeout;
            let t_bounds = t_bounds_timeout;
            const moveDirection = new Vector2(direction.x, direction.z);

            // Ensure gesture is not being played
            this._npc.CancelGesture();

            while (t_max_move > 0) {  // max movement time
                this._npc.Move( moveDirection );
                t_max_move -= Time.deltaTime;
                t_bounds -= Time.deltaTime;
                
                if (t_bounds < 0) {
                    t_bounds = t_bounds_timeout;
                    
                    const check = CheckBounds(this._npc.transform.position, this._moveArea);
                    if (check == -1) {
                        this.ResetNPCPosition();
                        break;
                    }
                    else if (check == 0)
                        break;
                }

                if (Vector3.Distance(end, this._npc.transform.position) < 0.1)
                    break;
                
                yield new WaitForEndOfFrame();
            }
            
            this._npc.StopMoving();

            yield new WaitForSeconds(idleTime);
        }
    }
    
    private ResetNPCPosition() {
        if (this.enableTeleport)
            this._npc.Teleport(this._initialPosition, this._initialRotation );
    }
    
    private Update() {
        if (this._speechBubbleActive) {
            this.UpdateCanvasRotation();
        }
    }

    private UpdateCanvasRotation() {
        this._canvas.transform.LookAt(this._cachedWorldCamera.transform);
        this._canvas.transform.Rotate(0, 180, 0);
    }
}