import { Vector3 } from "UnityEngine";

export class Checkpoint {
    public index: int;
    public position: Vector3;
    
    constructor(index: int, position: Vector3) {
        this.index = index;
        this.position = position;
    }
}