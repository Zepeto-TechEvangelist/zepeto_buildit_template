import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {GameObject, Object, Quaternion, Resources, Vector3, WaitForSeconds, WaitUntil} from "UnityEngine";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import VehicleAttachController from "./VehicleAttachController";

// Multiplay Sync
import { MESSAGE, VehicleObject, VehicleAction, VehicleMessage, VehicleSync } from "./Types";
import { RoomBase, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoWorldMultiplay } from "ZEPETO.World";
import { Player, sVector3, sQuaternion } from 'ZEPETO.Multiplay.Schema';
import MultiplayManager from '../../../../Zepeto Multiplay Component/ZepetoScript/Common/MultiplayManager';
import { ApplicationUtilities } from "../../Scripts/Utility/ApplicationUtilities";

export default class VehicleManager extends ZepetoScriptBehaviour {
    
    private ObjectCache: VehicleAttachController[] = [];

    public localPlayerAttachedVehicle: VehicleAttachController = null;
    
    public get isLocalPlayerDriving(): boolean { return this.localPlayerAttachedVehicle !== null }
    

    public GetController(id: string, searchByName: boolean = true): VehicleAttachController | null {
        const cached = this.ObjectCache.find(x => x.syncObj.id == id);
        if (cached)
            return cached;
        
        if (searchByName)
            return GameObject.Find(id)?.GetComponentInChildren<VehicleAttachController>();
        
        return null;
    }
    
    public RegisterController(controller: VehicleAttachController) {
        this.ObjectCache.push(controller);
    }
    
    public UnregisterController(controller: VehicleAttachController) {
        this.ObjectCache.splice(this.ObjectCache.indexOf(controller), 1);
    }

    /**
     * The LocalPlayer session id
     */
    public get SessionId(): string { return this.room === null ? null : this.room.SessionId }
    
    /** ------------------------------------------------------------------------------------------------------- */

    private _room: RoomBase = null;
    private get room(): RoomBase {
        if (!this._room)
            this._room = MultiplayManager.instance.room;
        return this._room;
    }
    
    private sync_initialized = false;
    private initial_sync_completed = false;

    Start() {
        
        const multiplay = MultiplayManager.instance.multiplay;

        if (this.room != null) {
            this.StartCoroutine(this.Bind());
        } else {
            multiplay.RoomJoined += room => {
                this._room = room;
                
                this.StartCoroutine(this.Bind());
            };
        }
    }

    private *Bind() {

        // Make sure room ownership is established (not required)
        yield new WaitUntil(() => this.SessionId != null);

        yield new WaitUntil(() => ZepetoPlayers.instance.LocalPlayer != null);
        
        yield new WaitForSeconds(1.5);
        
        
        const IsMaster = MultiplayManager.instance.IsMaster;
        
        this.InitializeMultiplaySync(); // Callbacks
        
        const controllers: VehicleAttachController[] = GameObject.FindObjectsOfType<VehicleAttachController>(true);
        
        var i = 0;
        for (const controller of controllers) {
            
            let i = 0;
            let suffix = "";
            while (this.GetController(controller.vehicleObj.name + suffix, false)) {

                if (ApplicationUtilities.isEditor)
                    console.warn(`Duplicate vehicle [${controller.vehicleObj.name + suffix}], please use unique object names`);
                
                suffix = `_${i++}`;
            }
            
            const syncObj = this.CreateSyncObject(controller, suffix);
            controller.syncObj = syncObj;
            controller.vehicleObj.name = syncObj.id;
            
            this.RegisterController(controller);
            
            this.InstantiateVehicle(controller);
        }

        yield new WaitForSeconds(1);
        
        this.room.Send(MESSAGE.VehicleSync, null);
    }
    
    private SendControllers() {
        
    }
    
    private ReceiveControllers(syncObjects: VehicleObject[]) {
        
        for (const obj of syncObjects) {
            
            let attach = this.GetController(obj.id);

            if (!attach)
                attach = this.SyncCreateVehicle(obj);
            else
                attach?.SyncState(obj);
        }
    }

    /**
     *  Set up multiplay message handler callbacks
     */
    private InitializeMultiplaySync() {

        if (this.sync_initialized)
            return;
        this.sync_initialized = true;

        const room = MultiplayManager.instance.room;
        const multiplay = MultiplayManager.instance.multiplay;
        
        room.AddMessageHandler(MESSAGE.VehicleSync, (message: VehicleSync) => {
            this.ReceiveControllers(message.cache);
            // Find objects in the cache etc
            this.initial_sync_completed = true;
        });

        room.AddMessageHandler(MESSAGE.VehicleGetIn, (message: VehicleObject) => {
            const player = ZepetoPlayers.instance.GetPlayer(message.ownerId);
            let attachController = this.GetController(message.id);
            if (!attachController)
                attachController = this.SyncCreateVehicle(message);
            
            attachController?.GetInPlayer(player);
        });

        room.AddMessageHandler(MESSAGE.VehicleGetOut, (message: VehicleObject) => {
            const player = ZepetoPlayers.instance.GetPlayer(message.ownerId);
            const attachController =  player.character.transform.GetComponentInChildren<VehicleAttachController>();

            attachController?.GetOutPlayer(player);
        });
        
        room.AddMessageHandler(MESSAGE.VehicleAction, (message: VehicleMessage) => {
            const player = ZepetoPlayers.instance.GetPlayerWithUserId(message.player);
            const attachController =  player.character.transform.GetComponentInChildren<VehicleAttachController>();

            attachController?.VehicleAction(message.action);
        });

        room.AddMessageHandler(MESSAGE.VehicleInstantiate, (message: VehicleObject) => {
            
            const baseAssetPath = "Vehicle/Prefabs/";
            const asset = Resources.Load(baseAssetPath + message.assetId) as GameObject;
            const spawnPosition = message.spawnPosition ? new Vector3(message.spawnPosition.x, message.spawnPosition.y, message.spawnPosition.z) : asset.transform.position;
            const spawnRotation = message.spawnRotation ? new Quaternion(message.spawnRotation.x, message.spawnRotation.y, message.spawnRotation.z, message.spawnRotation.w) : asset.transform.rotation

            const instance: GameObject = Object.Instantiate(asset, spawnPosition, spawnRotation) as GameObject;
            instance.name = message.id;

            const attach = instance.GetComponentInChildren<VehicleAttachController>();
            attach.syncObj = message;

            this.RegisterController(attach);

            const player = ZepetoPlayers.instance.GetPlayer(message.ownerId);
            attach?.GetInPlayer(player);
        });

        room.AddMessageHandler(MESSAGE.VehicleDestroy, (message: VehicleObject) => {
            
            const attach = this.GetController(message.id);
            this.UnregisterController(attach);
            Object.Destroy(attach.vehicleObj);
        });
    }
    
    private SyncCreateVehicle(message: VehicleObject): VehicleAttachController {
        const baseAssetPath = "Vehicle/Prefabs/";
        const asset = Resources.Load(baseAssetPath + message.assetId) as GameObject;
        const spawnPosition = message.spawnPosition ? new Vector3(message.spawnPosition.x, message.spawnPosition.y, message.spawnPosition.z) : asset.transform.position;
        const spawnRotation = message.spawnRotation ? new Quaternion(message.spawnRotation.x, message.spawnRotation.y, message.spawnRotation.z, message.spawnRotation.w) : asset.transform.rotation

        if (asset === null) // Missing asset
            return null;
        
        const instance: GameObject = Object.Instantiate(asset, spawnPosition, spawnRotation) as GameObject;
        instance.name = message.id;

        const attach = instance.GetComponentInChildren<VehicleAttachController>();
        attach.syncObj = message;

        this.RegisterController(attach);

        return attach;
    }
    
    public CreateSyncObject(attacher: VehicleAttachController, index: string = ""): VehicleObject {

        const position = attacher.vehicleObj.transform.position;
        const rotation = attacher.vehicleObj.transform.rotation;
        
        const vo: VehicleObject = {
            id: attacher.vehicleObj.name + index,
            assetId: attacher.vehicleSettings.targetObject.assetKey,
            ownerId: null, //this.SessionId,
            spawnPosition: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            spawnRotation: {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z,
                w: rotation.w
            }
        };
        
        return vo;
    }
    
    public UpdateSyncObject(attacher: VehicleAttachController) {
        
        const position = attacher.vehicleObj.transform.position;
        const rotation = attacher.vehicleObj.transform.rotation;

        attacher.syncObj.spawnPosition = {
            x: position.x,
            y: position.y,
            z: position.z
        };
        attacher.syncObj.spawnRotation = {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
            w: rotation.w
        };
    }
    
    /**
     * Creates a Vehicle object and returns the instance
     * @param asset
     * @param position
     * @param rotation
     */
    public CreateVehicle(asset: GameObject, position: Vector3 = Vector3.zero, rotation: Quaternion = Quaternion.identity): GameObject {
        
        const instance = Object.Instantiate(asset, position, rotation) as GameObject;
        
        const attacher = instance.transform.GetComponentInChildren<VehicleAttachController>();
        
        const syncObject = this.CreateSyncObject(attacher);
        syncObject.ownerId = this.SessionId;
        attacher.syncObj = syncObject;

        this.RegisterController(attacher);

        MultiplayManager.instance.room.Send(MESSAGE.VehicleInstantiate, syncObject);

        return instance;
    }

    /**
     * Get in Vehicle action (Local Player)
     * @param attach
     */
    public GetInVehicle(attach: VehicleAttachController) {
        
        const message = attach.syncObj;
        message.ownerId = this.SessionId;
        
        this.localPlayerAttachedVehicle = attach;
        
        this.room?.Send(MESSAGE.VehicleGetIn, message);
    }

    /**
     * Get out Vehicle action (Local Player)
     * @param attach
     */
    public GetOutVehicle(attach: VehicleAttachController) {
        
        const message = attach.syncObj;
        // message.ownerId = null;
        this.UpdateSyncObject(attach);
        
        this.localPlayerAttachedVehicle = null;
        
        this.room?.Send(MESSAGE.VehicleGetOut, message);
        
        message.ownerId = null;
    }

    /**
     * Miscelanious Vehicle action (Local Player)
     * @param attach
     * @param action
     */
    public VehicleAction(attach: VehicleAttachController, action: VehicleAction) {

        const message: VehicleMessage = {
            id: attach.syncObj.id,
            action: action,
            player: "",
            seat: 0
        };
        this.room?.Send(MESSAGE.VehicleAction, message);
    }

    /**
     * Synchronize a vehicle object Instantiation
     * @param attach
     */
    public InstantiateVehicle(attach: VehicleAttachController) {
        MultiplayManager.instance.room.Send(MESSAGE.VehicleInstantiate, attach.syncObj);
    }

    /**
     * Synchronize a vehicle object Destruction
     * @param attach
     */
    public DestroyVehicle(attach: VehicleAttachController) {
        MultiplayManager.instance.room.Send(MESSAGE.VehicleDestroy, attach.syncObj);
    }

    /** ------------------------------------------------------------------------------------------------------- */
    /** Singleton */
    private static m_instance: VehicleManager = null;

    public static get instance(): VehicleManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<VehicleManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(VehicleManager.name).AddComponent<VehicleManager>();
            }
        }
        return this.m_instance;
    }

    private Awake() {
        if (VehicleManager.m_instance !== null && VehicleManager.m_instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            VehicleManager.m_instance = this;
            if (this.transform.parent === null)
                GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    /** ------------------------------------------------------------------------------------------------------- */
}