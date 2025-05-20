import { ZepetoCharacter, ZepetoPlayers, ZepetoPlayer, ZepetoCamera } from 'ZEPETO.Character.Controller';
import { ZepetoPropertyFlag, ZepetoContext } from 'Zepeto';
import { Camera, Bounds, Vector2, Vector3, MeshRenderer, SkinnedMeshRenderer, Screen, Transform } from 'UnityEngine';

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
    


}