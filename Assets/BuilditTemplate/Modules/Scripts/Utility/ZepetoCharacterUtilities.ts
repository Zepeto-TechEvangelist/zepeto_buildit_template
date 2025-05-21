import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import { ZepetoPropertyFlag, ZepetoContext } from 'Zepeto';
import {
    Camera,
    Bounds,
    Vector2,
    Vector3,
    MeshRenderer,
    SkinnedMeshRenderer,
    Screen,
    Transform,
    GameObject,
    Quaternion
} from 'UnityEngine';

export class ZepetoCharacterUtilities {

    public static GetCharacterScale(character: ZepetoCharacter) : float {
        return character.Context.transform.localScale.x;
    }

    public static GetPlayerCameraModifier(player: ZepetoPlayer) : float{
        return 1;
    }

    public static FullScreenScale(character: ZepetoCharacter) {
        var perspectiveCompensation = 0.95;


        var cam = ZepetoPlayers.instance.ZepetoCamera.camera;
        let bounds = character.GetComponentInChildren<SkinnedMeshRenderer>().bounds;
        let screenSize = new Vector2(Screen.width, Screen.height);

        //Get the position on screen.
        let screenPosition = cam.WorldToScreenPoint(bounds.center);
        //Get the position on screen from the position + the bounds of the object.
        let sizePosition = cam.WorldToScreenPoint(bounds.center + bounds.size);
        //By subtracting the screen position from the size position, we get the size of the object on screen.
        let objectSize = sizePosition - screenPosition;
        //Calculate how many times the object can be scaled up.
        let scaleFactor = Vector2.op_Division(screenSize, new Vector2(objectSize.x, objectSize.y));
        //The maximum scale is the one form the longest side, with the lowest scale factor.
        let maximumScale = Math.abs(scaleFactor.y); //Math.min(scaleFactor.x, scaleFactor.y);
        console.log("Max Scale " + maximumScale)
        if (cam.orthographic)
        {
            //Scale the orthographic size.
            cam.orthographicSize = cam.orthographicSize / maximumScale;
        }
        else
        {
            //Set the scale of the object.
            // character.transform.localScale = character.transform.localScale * maximumScale * perspectiveCompensation;
            
            // Logic for additional zoom
        }
    }


    public static TopBoundsAdjustment(character: ZepetoCharacter) {
        
        let bounds = character.GetComponentInChildren<SkinnedMeshRenderer>().bounds;
        
        console.log("Character Bounds Height: " + bounds.size.y);
    }
    
    public static AdjustCameraLookAtTarget(character: ZepetoCharacter, target: GameObject) {

        let zepetoCamera = ZepetoPlayers.instance.ZepetoCamera;
        let camera = zepetoCamera.camera;
        let player = ZepetoPlayers.instance.LocalPlayer;
        
        // 0. Miscelanious settings
        zepetoCamera.useCharacterCulling = false;
        
        // 1. Look at target
        camera.fieldOfView = 7;
        camera.transform.localRotation = Quaternion.Euler(3, 0, 0); // this works because follow is enabled
        
        // 2. Raycast target position
        let targetPosition = camera.WorldToScreenPoint(target.transform.position);
        let screenSize = new Vector2(Screen.width, Screen.height);
        
        // 3. Adjust height
        let adjustY = targetPosition.y - (Screen.height * 0.75);
        const additionalOffset = new Vector3(0, adjustY, 0);
        if (additionalOffset.y > 0)
            zepetoCamera.additionalOffset = additionalOffset;
        
    }


}