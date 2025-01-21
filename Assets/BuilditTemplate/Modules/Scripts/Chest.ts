import {Quaternion, Time, Transform, AudioSource, GameObject} from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'


export default class Chest extends ZepetoScriptBehaviour {

    public isOpen: boolean = true;
    
    public lid: Transform;
    public gold: Transform;
    public glow: GameObject;
    public openRef: Transform;
    public closeRef: Transform;
    public openSpeed: number = 5;
    
    public openAudio: AudioSource;
    public closeAudio: AudioSource;

    Update () {
        if(this.isOpen){
            this.SetRotation(this.openRef.rotation);
        }
        else{
            this.SetRotation(this.closeRef.rotation);
        }
    }
    
    public Open(open: boolean) {
        if (this.isOpen == open) return;
        
        this.isOpen = open;
        if (open) {
            this.openAudio?.Play();
            this.glow.SetActive(true);
        }
        else {
            this.glow.SetActive(false);
            this.closeAudio?.Play();
        }
    }
    
    
    private SetRotation(toRot: Quaternion) {
        if (this.lid.rotation != toRot) {
            this.lid.rotation = Quaternion.Lerp(this.lid.rotation, toRot, Time.deltaTime * this.openSpeed);
        }
    }
    
}