import { GameObject } from 'UnityEngine';
import { Animator, Camera, HumanBodyBones, Object, Quaternion, Transform, Vector3 } from 'UnityEngine';
import {Button, Text} from 'UnityEngine.UI';
import {KnowSockets, ZepetoCharacter, ZepetoPlayerControl, ZepetoPlayers, ZepetoCameraControl, ZepetoCamera} from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { RoundedRectangleButton } from 'ZEPETO.World.Gui';
import ScreenshotController from '../Screenshot/Scripts/ScreenshotController';
import ScreenshotUIController from '../Screenshot/Scripts/ScreenshotUIController';

export default class SelfieController extends ZepetoScriptBehaviour {
    
    private _screenshotController: ScreenshotController;
    private _screenshotUIController :ScreenshotUIController;

    private _zepetoCharacter: ZepetoCharacter;
    private _headBone: Transform;
    private _isSelfieMode: boolean;
    private _isScreenshotMode: boolean;
    private _mainCamera: Camera;
    private _originalCameraFieldOfView: number;
    
    private _originalPosition: Vector3;
    private _originalRotation: Quaternion;
    private _initialHeadBoneAngle: Vector3;
    
    Awake() {
        this._screenshotController = this.gameObject.GetComponent<ScreenshotController>();
        this._screenshotUIController = this.gameObject.GetComponent<ScreenshotUIController>();
    }
    
    Start() {
        
        // Add listener to selfie mode button and start or end selfie mode.
        // Set the screenshot panel active so that the panel doesn't disappear when the selfie mode button is clicekd.
        this._screenshotUIController.SelfieModeButton.onClick.AddListener(() => {
            if (!this._isSelfieMode) {
                this.StartSelfieMode();
            } else {
                this.EndSelfieMode();
            }
        });

        this._screenshotUIController.ExitButton.onClick.AddListener(() => { this.EndSelfieMode(); });
        
        
        
    }

    // Method to show or hide selfie button.
    public ToggleSelfieMode() {
        if (this._isSelfieMode) {
            this.EndSelfieMode();
        }
        this._isScreenshotMode = !this._isScreenshotMode;
    }

    // Method to start selfie mode. 
    public StartSelfieMode() {

        this._zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

        const animator: Animator = this._zepetoCharacter.ZepetoAnimator;
        this._headBone = animator.GetBoneTransform(HumanBodyBones.Head);
        
        // this._headBone = this._zepetoCharacter.GetSocket(KnowSockets.HEAD_UPPER);
        this._mainCamera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;
        
        console.log(this._headBone);
        
        if (!this._mainCamera || this._isSelfieMode == true) {
            return;
        }

        // Save the initial local euler angle of the head bone.
        this._initialHeadBoneAngle = this._headBone.localEulerAngles;
        this._originalCameraFieldOfView = this._mainCamera.fieldOfView;

        // Rotate the character's body to face the camera when selfie mode is enabled.
        const cameraPos = this._mainCamera.transform.position;
        const characterPos = this._zepetoCharacter.transform.position;
        const direction = new Vector3(cameraPos.x - characterPos.x, 0, cameraPos.z - characterPos.z);
        if (direction.magnitude > 0.001) {
            const lookRot = Quaternion.LookRotation(direction);
            this._zepetoCharacter.transform.rotation = lookRot;
        }

        // Save the original position and rotation of the character.
        this._originalPosition = this._zepetoCharacter.transform.position;
        this._originalRotation = this._zepetoCharacter.transform.rotation;

        // this._zepetoCharacter.constraintRotation = true;
        
        // Change the field of view and local rotation of the main camera to make it zoom into the character's head.
        this._mainCamera.fieldOfView = 7;
        this._mainCamera.transform.localRotation = Quaternion.Euler(3, 0, 0);

        ;
        
        const playerControl = Object.FindObjectOfType<ZepetoPlayerControl>();
        // const cameraControl = Object.FindObjectOfType<ZepetoCameraControl>();
        playerControl.Enable = false;
        // cameraControl.Enable = false;
        // ZepetoPlayers.instance.LocalPlayer.zepetoCamera.tar
        this._isSelfieMode = true

        this._zepetoCharacter.ZepetoAnimator.Play("Idle");
    }

    // Method to end selfie mode.
    public EndSelfieMode() {
        if (!this._mainCamera || this._isSelfieMode == false) {
            return;
        }

        this._zepetoCharacter.constraintRotation = false;
        
        // Revert the changes made on main camera.
        this._mainCamera.fieldOfView = this._originalCameraFieldOfView;
        this._mainCamera.transform.localRotation = Quaternion.identity;  // Quaternion.identity
        this._isSelfieMode = false;

        const playerControl = Object.FindObjectOfType<ZepetoPlayerControl>();
        const cameraControl = Object.FindObjectOfType<ZepetoCameraControl>();
        playerControl.Enable = true;

    }

    // Makes the character look at the camera and unable to move while in selfie mode.
    LateUpdate() {
        
        if (false == this._isSelfieMode || this._headBone == null)
            return;
        
        // this._zepetoCharacter.transform.position = this._originalPosition;
        // this._zepetoCharacter.transform.rotation = this._originalRotation;
        // 
        this._headBone.LookAt(this._mainCamera.transform.position);
        this.LimitRotation();
    }

    // Method to limit the head bone's rotation.
    private LimitRotation() {
        let outOfBounds = (this._headBone.localEulerAngles.z < 20 || this._headBone.localEulerAngles.z > 150) ? true : false;
        this._headBone.localRotation = Quaternion.Euler( outOfBounds ? this._initialHeadBoneAngle : this._headBone.localEulerAngles );
    }

}