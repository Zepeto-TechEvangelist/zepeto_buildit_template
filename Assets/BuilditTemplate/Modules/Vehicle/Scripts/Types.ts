import {sQuaternion, sVector3} from "ZEPETO.Multiplay.Schema";

export interface VehicleMessage {
    id: string, // player
    player: string,
    action: VehicleAction,
    seat: number,   // temp for now
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

export interface VehicleSync {
    cache: VehicleObject[]
}

export enum VehicleAction {
    GetIn = -1,
    GetOut,
    Horn,
    Lights,
    Boost,
}

export enum MESSAGE {
    VehicleGetIn = "VehicleGetIn",
    VehicleGetOut = "VehicleGetOut",
    VehicleAction = "VehicleAction",
    VehicleSync = "VehicleSync",
    VehicleInstantiate = "VehicleInstantiate",
    VehicleDestroy = "VehicleDestroy"
}