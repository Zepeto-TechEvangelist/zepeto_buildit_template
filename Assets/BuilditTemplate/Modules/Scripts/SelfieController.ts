import { GameObject } from 'UnityEngine';
import { Animator, Camera, HumanBodyBones, Object, Quaternion, Transform, Vector3 } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import {KnowSockets, ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { RoundedRectangleButton } from 'ZEPETO.World.Gui';

export default class SelfieController extends ZepetoScriptBehaviour {

    public selfieModeButton: GameObject;
    
    private _screenshotButton: Button;
    private _screenshotPanel: GameObject;
    private _screenshotExitButton: Button;
    private _screenshotVideoButton: Button;
    private _mainCamera: Camera;
    private _originalCameraFieldOfView: number;
    private _isScreenshotMode: bool = false;
    private _isSelfieMode: bool = false;
    private _isRecordingVideo: bool = false;
    private _zepetoCharacter: ZepetoCharacter;
    private _headBone: Transform;
    private _originalPosition: Vector3;
    private _originalRotation: Quaternion;
    private _initialHeadBoneAngle: Vector3;

    Start() {
        // Find screenshot UI components.
        const managers = GameObject.Find("Managers");
        const screenshot = managers.transform.Find("ScreenShot");
        const screenshotBtn = screenshot.transform.Find("ScreenShotBtn");
        this._screenshotButton = screenshotBtn.GetComponent<Button>();
        const panel = screenshot.transform.Find("SafeArea/ScreenShot/ScreenshotPanel");
        this._screenshotPanel = panel.gameObject;
        const exitBtn = this._screenshotPanel.transform.Find("ScreenshotSubButtonBG/ScreenshotPanelExitButton");
        this._screenshotExitButton = exitBtn.GetComponent<Button>();
        const videoBtn = this._screenshotPanel.transform.Find("ScreenshotSubButtonBG/VideoButton");
        this._screenshotVideoButton = videoBtn.GetComponent<Button>();



        // Initialize zepetoCharacter with the current player's character and get the head bone of it.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            const animator: Animator = this._zepetoCharacter.ZepetoAnimator;
            
            // this._headBone = animator.GetBoneTransform(HumanBodyBones.Head);
            // TODO: Replace this with 
            this._headBone = this._zepetoCharacter.GetSocket(KnowSockets.HEAD_UPPER);
        });

        // Find the main camera in the scene and save its original field of view.
        this._mainCamera = Object.FindObjectOfType<Camera>();   // TODO: Camera.main
        this._originalCameraFieldOfView = this._mainCamera.fieldOfView; // TODO: Capture only when switching


        // TODO: Group all subscribers in a function for code clarity

        // Once the screenshot button is clicked, show or hide selfie button.
        this._screenshotButton.onClick.AddListener(() => {
            this.ToggleSelfieButton();
        })

        // Once the exit button is clicked, hide selfie button.
        // If the user clicks the exit button while in selfie mode, exit selfie mode as well.
        this._screenshotExitButton.onClick.AddListener(() => {
            this.ToggleSelfieButton();
        })

        // Add listener to selfie mode button and start or end selfie mode.
        // Set the screenshot panel active so that the panel doesn't disappear when the selfie mode button is clicekd.
        this.selfieModeButton.GetComponent<Button>().onClick.AddListener(() => {
            if (!this._isSelfieMode) {
                this.StartSelfieMode();
            } else {
                this.EndSelfieMode();
            }
            this._screenshotPanel.SetActive(true);
        });

        // Hide selfie mode button while a video is being recorded.
        this._screenshotVideoButton.onClick.AddListener(() => {
            if (!this._isRecordingVideo) {
                this.selfieModeButton.SetActive(false);
            } else {
                this.selfieModeButton.SetActive(true);
            }
            this._isRecordingVideo = !this._isRecordingVideo;
        })
    }

    // Method to show or hide selfie button.
    private ToggleSelfieButton() {
        if (!this._isScreenshotMode) {
            this.selfieModeButton.SetActive(true);
        } else {
            this.selfieModeButton.SetActive(false);
        }
        if (this._isSelfieMode) {
            this.EndSelfieMode();
        }
        this._isScreenshotMode = !this._isScreenshotMode;
    }

    // Method to start selfie mode. 
    private StartSelfieMode() {
        if (!this._mainCamera) {
            return;
        }

        // Save the initial local euler angle of the head bone.
        this._initialHeadBoneAngle = this._headBone.localEulerAngles;

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

        // Change the field of view and local rotation of the main camera to make it zoom into the character's head.
        this._mainCamera.fieldOfView = 7;
        this._mainCamera.transform.localRotation = Quaternion.Euler(3, 0, 0);

        this._isSelfieMode = true;
    }

    // Method to end selfie mode.
    private EndSelfieMode() {
        if (!this._mainCamera) {
            return;
        }

        // Revert the changes made on main camera.
        this._mainCamera.fieldOfView = this._originalCameraFieldOfView;
        this._mainCamera.transform.localRotation = Quaternion.identity;  // Quaternion.identity
        this._isSelfieMode = false;
    }

    // Makes the character look at the camera and unable to move while in selfie mode.
    LateUpdate() {
        
        if (false == this._isSelfieMode || this._headBone == null)
            return;
        this._zepetoCharacter.transform.position = this._originalPosition;
        this._zepetoCharacter.transform.rotation = this._originalRotation;
        this._zepetoCharacter.ZepetoAnimator.Play("Idle");

        this._headBone.LookAt(this._mainCamera.transform.position);
        this.LimitRotation();
    }

    // Method to limit the head bone's rotation.
    private LimitRotation() {
        let outOfBounds = (this._headBone.localEulerAngles.z < 5 || this._headBone.localEulerAngles.z > 175); // ? true : false;
        this._headBone.localRotation = Quaternion.Euler( outOfBounds ? this._initialHeadBoneAngle : this._headBone.localEulerAngles );
    }

}