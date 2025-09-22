import { SandboxPlayer } from "ZEPETO.Multiplay";
import { IModule } from "../IModule";
// import {GameObject} from "UnityEngine";
// import { sVector3, sQuaternion } from "ZEPETO.Multiplay.Schema";

export default class VehicleModule extends IModule {
    // private sessionIdQueue: string[] = [];
    private vehicleCache: VehicleObject[] = [];
    // private masterClient: Function = (): SandboxPlayer | undefined => this.server.loadPlayer(this.sessionIdQueue[0]);

    async OnCreate() {
        
        this.server.onMessage(MESSAGE.VehicleGetIn, (client: SandboxPlayer, message: VehicleObject) => {
            
            let cached = this.GetCachedObject(message.id);
            if (cached) {
                cached.ownerId = client.sessionId;
                cached.spawnPosition = message.spawnPosition;
                cached.spawnRotation = message.spawnRotation;
            }
            else
                this.vehicleCache.push(message);
            
            this.server.broadcast(MESSAGE.VehicleGetIn, message, { except: client.sessionId });
        });

        this.server.onMessage(MESSAGE.VehicleGetOut, (client: SandboxPlayer, message: VehicleObject) => {
            
            let cached = this.GetCachedObject(message.id);
            if (cached) {
                cached.ownerId = null;
                cached.spawnPosition = message.spawnPosition;
                cached.spawnRotation = message.spawnRotation;
            }
            else
                this.vehicleCache.push(message);
            
            this.server.broadcast(MESSAGE.VehicleGetOut, message, { except: client.sessionId });
        });

        this.server.onMessage(MESSAGE.VehicleAction, (client: SandboxPlayer, message: VehicleMessage) => {
            message.player = client.userId;
            this.server.broadcast(MESSAGE.VehicleAction, message, { except: client.sessionId });
        });

        this.server.onMessage(MESSAGE.VehicleInstantiate, (client: SandboxPlayer, message: VehicleObject) => {
            // console.log("[Instantiate] " + client.userId + " " + message.id );
            if (this.GetCachedObject(message.id)) 
                return;
            
            this.vehicleCache.push(message);
            this.server.broadcast(MESSAGE.VehicleInstantiate, message, { except: client.sessionId });
        });
        
        this.server.onMessage(MESSAGE.VehicleDestroy, (client: SandboxPlayer, message: VehicleObject) => {
            // console.log("[Destroy] " + client.userId + " " + message.id );
            const index = this.vehicleCache.findIndex(x => x.id == message.id);
            this.vehicleCache.splice(index, 1);
            
            this.server.broadcast(MESSAGE.VehicleDestroy, message, { except: client.sessionId });
        });

        this.server.onMessage(MESSAGE.VehicleSync, (client: SandboxPlayer, message: any) => {
            const sync: VehicleSync = { cache: this.vehicleCache };
            client.send(MESSAGE.VehicleSync, sync);
        });
        
    }

    async OnJoin(client: SandboxPlayer) {
        // if (!this.sessionIdQueue.includes(client.sessionId)) {
        //     this.sessionIdQueue.push(client.sessionId.toString());
        // }
    }

    async OnLeave(client: SandboxPlayer) {
        // if (this.sessionIdQueue.includes(client.sessionId)) {
        //     const leavePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
        //     this.sessionIdQueue.splice(leavePlayerIndex, 1);
        //     if (leavePlayerIndex == 0) {
        //         console.log(`master->, ${this.sessionIdQueue[0]}`);
        //         this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
        //     }
        // }
    }

    OnTick(deltaTime: number) {
    }
    
    public GetCachedObject(id: string): VehicleObject | null {
        return this.vehicleCache.find(x => x.id == id);
    }
}
interface VehicleMessage {
    id: string, // player
    player: string,
    action?: VehicleAction,
    seat?: number   // temp for now
}

export interface VehicleObject {
    id: string,
    assetId?: string,
    ownerId?: string,
    spawnPosition?: Vec3,
    spawnRotation?: Vec4,
}

export interface Vec3 {
    x: number,
    y: number,
    z: number
}

export interface Vec4 {
    x: number,
    y: number,
    z: number,
    w: number
}

interface VehicleSync {
    cache: VehicleObject[]
}

export enum VehicleAction {
    GetIn = -1, 
    GetOut,
    Horn,
    Lights,
    Boost,
}

enum MESSAGE {
    VehicleGetIn = "VehicleGetIn",
    VehicleGetOut = "VehicleGetOut",
    VehicleAction = "VehicleAction",
    VehicleSync = "VehicleSync",
    VehicleInstantiate = "VehicleInstantiate",
    VehicleDestroy = "VehicleDestroy"
}
