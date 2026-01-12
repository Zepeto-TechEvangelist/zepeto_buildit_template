import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { GameObject, Screen, WaitForSeconds, Coroutine, Time, Mathf, Color, Camera } from 'UnityEngine';
import { Button, Image, Text, RawImage } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import ScreenshotManager from '../../../BuilditTemplate/Modules/Screenshot/Scripts/ScreenshotManager';
import ScreenshotUIController from '../../../BuilditTemplate/Modules/Screenshot/Scripts/ScreenshotUIController';
import ScreenshotController from '../../../BuilditTemplate/Modules/Screenshot/Scripts/ScreenshotController';
import {UnityEvent$1} from "UnityEngine.Events";
import UIManager from "../../../BuilditTemplate/Modules/Scripts/UIManager";

/**
 * 2D World용 스크린샷 매니저
 * Portrait/Landscape 화면 비율에 따라 적절한 UI를 선택합니다.
 * 
 * 주의: 이 컴포넌트는 반드시 ScreenshotController와 함께 사용해야 합니다.
 * ScreenshotManager 싱글톤을 사용하지 않고 독립적으로 동작합니다.
 */
export default class ScreenshotManager2D extends ZepetoScriptBehaviour {

    /** ScreenshotController GameObject */
    @SerializeField() private _screenshotControllerObject: GameObject;
    
    /** 세로 모드용 UI Controller GameObject */
    @SerializeField() private _portraitUIControllerObject: GameObject;
    
    /** 가로 모드용 UI Controller GameObject */
    @SerializeField() private _landscapeUIControllerObject: GameObject;
    
    private _screenshotController: ScreenshotController;
    private _portraitUIController: ScreenshotUIController;
    private _landscapeUIController: ScreenshotUIController;
    private _currentActiveUI: ScreenshotUIController;
    
    private _canEnterOrExit: bool = true;
    private _isPhoto: bool;
    private _originalInputFeedMsg: string;
    private _coRecordingTimer: Coroutine;


    private screenshotActiveEvent: UnityEvent$1<boolean>;
    
    Awake() {
        // ScreenshotController 가져오기
        if (this._screenshotControllerObject) {
            this._screenshotController = this._screenshotControllerObject.GetComponent<ScreenshotController>();
        } else {
            this._screenshotController = this.gameObject.GetComponent<ScreenshotController>();
        }
        
        if (!this._screenshotController) {
            console.error("[ScreenshotManager2D] ScreenshotController not found! Please assign ScreenshotControllerObject in Inspector or attach to same GameObject.");
        }
        
        // GameObject로부터 ScreenshotUIController 컴포넌트 가져오기
        if (this._portraitUIControllerObject) {
            this._portraitUIController = this._portraitUIControllerObject.GetComponent<ScreenshotUIController>();
        }
        if (this._landscapeUIControllerObject) {
            this._landscapeUIController = this._landscapeUIControllerObject.GetComponent<ScreenshotUIController>();
        }
        
        if (!this._portraitUIController && !this._landscapeUIController) {
            console.error("[ScreenshotManager2D] No UIController found! Please assign Portrait or Landscape UIController Object in Inspector.");
        }
        
        // 양쪽 UI Controller 초기화
        this.InitializeScreenshotUI(this._portraitUIController);
        this.InitializeScreenshotUI(this._landscapeUIController);
        
    }

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._screenshotController.SetScreenshotCamera(GameObject.Find("ZepetoPlayers").GetComponentInChildren<Camera>());
        });
        
        this.LateInit();
    }

    private LateInit() {

        this.screenshotActiveEvent = new UnityEvent$1<boolean>();
        UIManager.instance.CreateToggleGroup("screenshot", this.screenshotActiveEvent, (isOn) => { this.ToggleScreenshotUI(); });

        UIManager.instance.screenshotOrientationChangeEvent.AddListener(() => {
            this.OnScreenRotation();
        });
    }
    
    /** 
     * 화면 비율을 확인하여 Portrait 또는 Landscape UIController를 선택합니다.
     */
    private SelectUIControllerByScreenRatio(): ScreenshotUIController {
        const isPortrait = Screen.height > Screen.width;
        
        if (isPortrait && this._portraitUIController) {
            console.log("[ScreenshotManager2D] Using Portrait UI Controller");
            
            // Landscape UI GameObject 비활성화
            if (this._landscapeUIControllerObject) {
                this._landscapeUIControllerObject.SetActive(false);
            }
            
            // Portrait UI GameObject 활성화
            if (this._portraitUIControllerObject) {
                this._portraitUIControllerObject.SetActive(true);
            }
            
            return this._portraitUIController;
            
        } else if (!isPortrait && this._landscapeUIController) {
            console.log("[ScreenshotManager2D] Using Landscape UI Controller");
            
            // Portrait UI GameObject 비활성화
            if (this._portraitUIControllerObject) {
                this._portraitUIControllerObject.SetActive(false);
            }
            
            // Landscape UI GameObject 활성화
            if (this._landscapeUIControllerObject) {
                this._landscapeUIControllerObject.SetActive(true);
            }
            
            return this._landscapeUIController;
            
        } else {
            console.error("[ScreenshotManager2D] No appropriate UIController found for current screen orientation!");
            return null;
        }
    }

    
    private OnScreenRotation() {
        
        if (!this._canEnterOrExit || !this._currentActiveUI)
            return;
        
        this._currentActiveUI.ToggleUI();
        this._currentActiveUI = this.SelectUIControllerByScreenRatio();

        this._currentActiveUI?.ToggleUI();
    }
    
    /**
     * 스크린샷 UI를 켜고 끕니다.
     * 버튼 OnClick 이벤트에서 호출하세요.
     */
    public ToggleScreenshotUI() {
        if (!this._canEnterOrExit) {
            return;
        }
        
        // 현재 어떤 UI가 켜져 있는지 확인
        const currentPortraitActive = this._portraitUIController && this._portraitUIController.IsUIActive;
        const currentLandscapeActive = this._landscapeUIController && this._landscapeUIController.IsUIActive;
        
        // 현재 켜져 있는 UI를 끄기
        if (currentPortraitActive) {
            this._portraitUIController.ToggleUI();
            this._currentActiveUI = null;
            return;
        }
        if (currentLandscapeActive) {
            this._landscapeUIController.ToggleUI();
            this._currentActiveUI = null;
            return;
        }
        
        // 아무것도 켜져있지 않으면 화면 비율에 따라 적절한 UI 선택 후 켜기
        this._currentActiveUI = this.SelectUIControllerByScreenRatio();
        
        if (!this._currentActiveUI) {
            console.error("[ScreenshotManager2D] Failed to select UIController!");
            return;
        }
        
        this._currentActiveUI.ToggleUI();

        this.screenshotActiveEvent?.Invoke( this._currentActiveUI.IsUIActive );
    }

    /* Initialize */
    private InitializeScreenshotUI(uiController: ScreenshotUIController) {
        if (!uiController) return;
        
        // Button Events
        uiController.TakePhotoScreenshotButton.onClick.AddListener(() => {
            this.TakePhotoScreenshotButtonAction();
        });

        uiController.TakeVideoScreenshotButton.onClick.AddListener(() => {
            this.TakeVideoScreenshotButtonAction();
        });

        uiController.ExitButton.onClick.AddListener(() => {
            this.ToggleScreenshotUI();
        });

        uiController.PreviewExitButton.onClick.AddListener(() => {
            this._screenshotController.DestroyVideoPlayerComponent(uiController.PreviewVideoRawImage);
            uiController.TogglePreviewRawImage(false);
            uiController.TogglePreviewVideoRawImage(false);
            uiController.PreviewWindow.SetActive(false);
            if (this._originalInputFeedMsg) {
                uiController.PreviewInputField.text = this._originalInputFeedMsg;
            }
        });

        uiController.PreviewUploadButton.onClick.AddListener(() => {
            this.OnClickUploadButton();
        });

        uiController.PreviewSaveButton.onClick.AddListener(() => {
            if (this._isPhoto) {
                this._screenshotController.PhotoSave();
            } else {
                this._screenshotController.VideoSave();
            }
        });

        uiController.PreviewShareButton.onClick.AddListener(() => {
            if (this._isPhoto) {
                this._screenshotController.PhotoShare();
            } else {
                this._screenshotController.VideoShare();
            }
        });

        // ScreenshotController Events (한 번만 등록)
        if (uiController === this._portraitUIController) {
            this._screenshotController.OnScreenshotDone.AddListener(() => {
                if (this._currentActiveUI) {
                    this._currentActiveUI.ToggleEasyUploadWindow(true);
                }
                this._isPhoto = true;
            });

            this._screenshotController.OnProgressEvent.AddListener(() => {
                if (this._currentActiveUI) {
                    this._currentActiveUI.ToggleProgressToastWindow(true);
                }
            });

            this._screenshotController.OnFailEvent.AddListener(() => {
                this.StartCoroutine(this.CoShowToastWindow(false));
            });

            this._screenshotController.OnSuccessEvent.AddListener(() => {
                this.StartCoroutine(this.CoShowToastWindow(true));
            });
        }

        // Result Toast Button Setting
        this.ResultToastButtonSetting(uiController.SimpleResultPanel, uiController);
        
        // Original Input Field Message 저장
        if (!this._originalInputFeedMsg && uiController.PreviewInputField) {
            this._originalInputFeedMsg = uiController.PreviewInputField.text;
        }
    }

    private ResultToastButtonSetting(simpleResultPanel: GameObject, uiController: ScreenshotUIController) {
        if (!simpleResultPanel) return;
        
        let buttons = simpleResultPanel.GetComponentsInChildren<Button>();

        buttons.forEach(button => {
            switch (button.name) {
                case "ScreenshotEditButton":
                    button.onClick.AddListener(() => {
                        this.OnClickEditButton();
                        uiController.ToggleEasyUploadWindow(false);
                    });
                    break;
                case "ScreenshotUploadButton":
                    button.onClick.AddListener(() => {
                        this.OnClickUploadButton();
                        uiController.ToggleEasyUploadWindow(false);
                    });
                    break;
                case "ScreenshotResultExit":
                    button.onClick.AddListener(() => {
                        uiController.ToggleEasyUploadWindow(false);
                    });
                    break;
                default:
                    break;
            }
        });
    }

    /* OnClick Actions */
    private OnClickUploadButton() {
        if (!this._currentActiveUI) return;
        
        if (this._isPhoto) {
            this._screenshotController.PhotoPostToFeed(this._currentActiveUI.PreviewInputField.text);
        } else {
            this._screenshotController.VideoPostToFeed(this._currentActiveUI.PreviewInputField.text);
        }
    }

    private OnClickEditButton() {
        if (!this._currentActiveUI) return;
        
        this._currentActiveUI.PreviewWindow.SetActive(true);

        if (this._isPhoto) {
            this._currentActiveUI.TogglePreviewRawImage(true);
            this._currentActiveUI.PreviewRawImage.GetComponent<RawImage>().texture = this._screenshotController.ScreenshotRenderTexture;
        } else {
            this._currentActiveUI.TogglePreviewVideoRawImage(true);
            this._screenshotController.PlayPreviewVideo(this._currentActiveUI.PreviewVideoRawImage, 1280, 720);
        }
    }

    private TakePhotoScreenshotButtonAction() {
        this._screenshotController.StartTakePhotoScreenshot();
    }

    private TakeVideoScreenshotButtonAction() {
        if (!this._currentActiveUI) return;
        
        this._isPhoto = false;
        this._screenshotController.ResetVideoRecordingEvent();
        
        this._screenshotController.OnVideoRecordingStartEvent.AddListener(() => {
            this.StartTimer();
        });
        
        this._screenshotController.OnVideoRecordingStopEvent.AddListener(() => {
            this.StopTimer();
            this._currentActiveUI.TakePhotoScreenshotButton.interactable = true;
            this._currentActiveUI.SelfieModeButton.interactable = true;
            this._currentActiveUI.ExitButton.interactable = true;
            this._screenshotController.StartTakePhotoScreenshot(true);
            this._currentActiveUI.ToggleEasyUploadWindow(true);
        });
        
        this._screenshotController.RecordVideo();
    }

    /* Timer */
    private StartTimer() {
        if (!this._currentActiveUI) return;
        
        this._coRecordingTimer = this.StartCoroutine(this.CoStartTimer());
        this._currentActiveUI.TakePhotoScreenshotButton.interactable = false;
        this._currentActiveUI.SelfieModeButton.interactable = false;
        this._currentActiveUI.ExitButton.interactable = false;
        this._canEnterOrExit = false;
        this.StartCoroutine(this.ImageColorPingpong(this._currentActiveUI.VideoTimer.GetComponent<Image>()));
    
        // Disable Rotation
        UIManager.instance.SetEnabled("rotation", false);
    }

    private StopTimer() {
        if (!this._currentActiveUI) return;
        
        this.StopCoroutine(this._coRecordingTimer);
        this._currentActiveUI.VideoTimer.SetActive(false);
        this._currentActiveUI.ExitButton.interactable = true;
        this._canEnterOrExit = true;

        // Disable Rotation
        UIManager.instance.SetEnabled("rotation", true);
    }

    private *ImageColorPingpong(image: Image) {
        while (image.gameObject.activeSelf) {
            image.color = Color.Lerp(new Color(1.000, 0.271, 0.235, 1.000), new Color(0.851, 0.243, 0.208, 1.000), Mathf.PingPong(Time.time, 1));
            yield null;
        }
    }

    /* Coroutines */
    private *CoStartTimer() {
        if (!this._currentActiveUI) return;
        
        let elapsedTime = 0;
        let videoTimerText = this._currentActiveUI.VideoTimer.GetComponentInChildren<Text>();
        this._currentActiveUI.VideoTimer.SetActive(true);
        
        while (true) {
            elapsedTime += Time.deltaTime;
            let time = Math.floor(elapsedTime);
            let timetext = "";

            if (time < 60) {
                timetext = `00:${time >= 10 ? time : '0' + time}`;
            } else {
                timetext = `${time % 60 >= 10 ? time % 60 : '0' + time % 60}:${time / 60 >= 10 ? time / 60 : '0' + time / 60}`;
            }
            videoTimerText.text = timetext;
            yield null;
        }
    }

    private *CoShowToastWindow(result: bool) {
        if (!this._currentActiveUI) return;
        
        if (result) {
            yield new WaitForSeconds(0.5);
            this._currentActiveUI.ToggleProgressToastWindow(false);
            this._currentActiveUI.ToggleSuccessToastWindow(true);
            this.StartCoroutine(this.CoHideToastWithTimer(this._currentActiveUI.SuccessToast, 2));
        } else {
            yield new WaitForSeconds(0.5);
            this._currentActiveUI.ToggleProgressToastWindow(false);
            this._currentActiveUI.ToggleFailToastWindow(true);
            this.StartCoroutine(this.CoHideToastWithTimer(this._currentActiveUI.FailToast, 2));
        }
    }

    private *CoHideToastWithTimer(toast: GameObject, timer: number) {
        let waitForSeconds = new WaitForSeconds(timer);
        yield waitForSeconds;

        if (GameObject.op_Equality(toast, null)) {
            return;
        } else {
            toast.SetActive(false);
        }
    }

}

