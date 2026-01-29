import {
    Application,
    AudioListener,
    Camera,
    Coroutine,
    GameObject,
    Material,
    Renderer,
    RenderTexture,
    WaitForEndOfFrame
} from 'UnityEngine'
import {UnityEvent, UnityEvent$1} from 'UnityEngine.Events';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {VideoPlayer} from 'UnityEngine.Video';
import {VideoResolutions, WorldVideoRecorder, ZepetoWorldContent} from 'ZEPETO.World';

const ALPHA_TEST_RENDER_QUEUE = 2450;
const TRANSPARENCY_RENDER_QUEUE = 3000;

/**
 * Class that takes a screenshot or a video from the current screen
 * It contains automation for separating renerable layers such as ignoring UI layer 
 */
export default class ScreenshotController extends ZepetoScriptBehaviour {

    @SerializeField() private _screenshotRenderTexture: RenderTexture;
    @SerializeField() private _videoMaxDuration: number = 60;
    @SerializeField() private _videoResolutionType: VideoResolutions = VideoResolutions.W720xH1280;
    @SerializeField() private _previewResolution: VideoResolutions = VideoResolutions.W720xH1280;
    
    private _mainCamera: Camera;
    private _replicaCamera: Camera;

    private _onScreenshotDone: UnityEvent;
    private _onFailEvent: UnityEvent;
    private _onSuccessEvent: UnityEvent;
    private _onProgressEvent: UnityEvent;

    private _onVideoRecordingStartEvent: UnityEvent;
    private _onVideoRecordingStopEvent: UnityEvent;
    
    private _onCameraChange: UnityEvent$1<Camera>;
    
    private _coRecordVideo: Coroutine;

    LateUpdate() {
        if (!this.IsValid(this._replicaCamera)) {
            return;
        }
        
        // Follow main camera
        this._replicaCamera.transform.position = this._mainCamera.transform.position;
        this._replicaCamera.transform.rotation = this._mainCamera.transform.rotation;
    }

    private IsValid(value: any) {
        if (value == undefined || value == null) {
            return false;
        }
        return true;
    }

    public SetScreenshotCamera(camera: Camera) {
        this._mainCamera = camera;
    }

    public get OnScreenshotDone() {
        if (!this.IsValid(this._onScreenshotDone)) {
            this._onScreenshotDone = new UnityEvent();
        }
        return this._onScreenshotDone;
    }

    public get OnFailEvent() {
        if (!this.IsValid(this._onFailEvent)) {
            this._onFailEvent = new UnityEvent();
        }
        return this._onFailEvent;
    }

    public get OnSuccessEvent() {
        if (!this.IsValid(this._onSuccessEvent)) {
            this._onSuccessEvent = new UnityEvent();
        }
        return this._onSuccessEvent;
    }

    public get OnProgressEvent() {
        if (!this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent = new UnityEvent();
        }
        return this._onProgressEvent;
    }

    public get OnVideoRecordingStartEvent() {
        if (!this.IsValid(this._onVideoRecordingStartEvent)) {
            this._onVideoRecordingStartEvent = new UnityEvent();
        }
        return this._onVideoRecordingStartEvent;
    }

    public get OnVideoRecordingStopEvent() {
        if (!this.IsValid(this._onVideoRecordingStopEvent)) {
            this._onVideoRecordingStopEvent = new UnityEvent();
        }
        return this._onVideoRecordingStopEvent;
    }

    public get OnCameraChange() {
        if (!this.IsValid(this._onCameraChange)) {
            this._onCameraChange = new UnityEvent$1<Camera>();
        }
        return this._onCameraChange;
    }
    
    // returns {RenderTexture}
    public get ScreenshotRenderTexture() {
        if (!this.IsValid(this._screenshotRenderTexture)) {
            console.error("Invalid screenshot RenderTexture for recording");
            return null;
        }
        return this._screenshotRenderTexture;
    }

    /**
     * Get the aspect ratio for screenshot output
     * @returns float The aspect ratio
     */
    public get screenshotAspectRatio() {
        
        let width = 0;
        let height = 0;
        if (this._videoResolutionType == VideoResolutions.W720xH1280) {
            width = 720;
            height = 1280;
        }
        else if (this._videoResolutionType == VideoResolutions.W1280xH720) {
            width = 1280;
            height = 720;
        }
        else if (this._videoResolutionType == VideoResolutions.W1920xH1080) {
            width = 1920;
            height = 1080;
        }
        else if (this._videoResolutionType == VideoResolutions.W1080xH1920) {
            width = 1080;
            height = 1920;
        }

        return width / height;
    }
    
    /**
     * Sets the rendering parameters for either Vertical (Portrait) or Horizontal (Landscape)
     * to respond to device changes in screen orientation.
     * 
     * @param isHorizontal
     */
    public SetScreenOrientation(isHorizontal: bool) {
        if (isHorizontal) {
            this._videoResolutionType = VideoResolutions.W1920xH1080;
            this._previewResolution = VideoResolutions.W1280xH720;
            this.ResizeRenderTexture(this._screenshotRenderTexture, 1920, 1080);
        }
        else {
            this._videoResolutionType = VideoResolutions.W1080xH1920;
            this._previewResolution = VideoResolutions.W720xH1280;
            this.ResizeRenderTexture(this._screenshotRenderTexture, 1080, 1920);
        }
    }
    
    
    /** -------------------------------------------------------------------------------------------------------- */
    /** Photo */
    
    /**
     * 
     * @param isVideo

     */
    public StartTakePhotoScreenshot(isVideo?: boolean) {

        let screenshotCamera = (GameObject.Instantiate(this._mainCamera) as GameObject).GetComponent<Camera>();
        GameObject.Destroy(screenshotCamera.GetComponent<AudioListener>());
        screenshotCamera.gameObject.name = "ScreenshotCamera";
        screenshotCamera.cullingMask &= ~(1 << 5);
        screenshotCamera.targetTexture = this._screenshotRenderTexture;
        this.StartCoroutine(this.CoTakePhotoScreenshot(screenshotCamera, isVideo));
    }
    
    private *CoTakePhotoScreenshot(camera: Camera, isVideo?: boolean) {
        let waitForEndOfFrame = new WaitForEndOfFrame();
        
        var atmat = this.FindAlphaTestMaterials();
        atmat.forEach(x => x.renderQueue = TRANSPARENCY_RENDER_QUEUE);
        
        yield waitForEndOfFrame;
        camera.transform.position = this._mainCamera.transform.position;
        camera.transform.rotation = this._mainCamera.transform.rotation;
        camera.Render();
        camera.targetTexture = null;
        
        atmat.forEach(x => x.renderQueue = ALPHA_TEST_RENDER_QUEUE);
        yield waitForEndOfFrame;
        
        if (!this.IsValid(isVideo)) {
            if (this.IsValid(this._onScreenshotDone)) {
                this._onScreenshotDone.Invoke();
            }
        }

        GameObject.Destroy(camera.gameObject);
    }

    public PhotoPostToFeed(feedMessage: string) {
        if (Application.isEditor) {
            this._onFailEvent.Invoke();
        }

        if (this.IsValid(this._onProgressEvent)) { 
            this._onProgressEvent.Invoke();
        }

        ZepetoWorldContent.CreateFeed(this._screenshotRenderTexture, feedMessage, (result: boolean) => {
            if (result && this.IsValid(this._onSuccessEvent)) {
                this._onSuccessEvent.Invoke();
            }

            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
        });
    }

    public PhotoSave() {
        if (Application.isEditor) {
            this._onFailEvent.Invoke();
        }

        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        ZepetoWorldContent.SaveToCameraRoll(this._screenshotRenderTexture, (result: boolean) => {
            if (result) {
                if (result && this.IsValid(this._onSuccessEvent)) {
                    this._onSuccessEvent.Invoke();
                }

                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
        });
    }

    public PhotoShare() {
        ZepetoWorldContent.Share(this._screenshotRenderTexture, (result: boolean) => {
            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
        });
    }

    /** -------------------------------------------------------------------------------------------------------- */
    /** Video */
    
    public ResetVideoRecordingEvent() {
        if (!this.IsValid(this._onVideoRecordingStartEvent)) {
            this._onVideoRecordingStartEvent = new UnityEvent();
        }
        else {
            this._onVideoRecordingStartEvent.RemoveAllListeners();
        }

        if (!this.IsValid(this._onVideoRecordingStopEvent)) {
            this._onVideoRecordingStopEvent = new UnityEvent();
        }
        else {
            this._onVideoRecordingStopEvent.RemoveAllListeners();
        }
    }

    public RecordVideo() {
        if (WorldVideoRecorder.IsRecording()) {
            this.StopCoroutine(this._coRecordVideo);
            this.RecordingDone();
        } else {
            this._coRecordVideo = this.StartCoroutine(this.CoRecordVideo());
        }
    }

    private *CoRecordVideo() {
        this._replicaCamera = (GameObject.Instantiate(this._mainCamera) as GameObject).GetComponent<Camera>();
        GameObject.Destroy(this._replicaCamera.GetComponent<AudioListener>());
        this._replicaCamera.gameObject.name = "ScreenshotCamera";
        this._replicaCamera.cullingMask &= ~(1 << 5);
        let startRecording = WorldVideoRecorder.StartRecording(this._replicaCamera, this._videoResolutionType, this._videoMaxDuration);
        
        // startRecording
        if (!startRecording) {
            if (this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
        } else {
            if (this.IsValid(this._onVideoRecordingStartEvent)) {
                this._onVideoRecordingStartEvent.Invoke();
            }
        }

        // IsRecording
        if (startRecording && !WorldVideoRecorder.IsRecording()) {
            if (this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
            return;
        }
        
        // Publish Camera Change
        this._onCameraChange?.Invoke(this._replicaCamera);
        
        while (WorldVideoRecorder.IsRecording()) {
            yield null;
        }

        // RecordingDone
        this.RecordingDone();
    }

    private RecordingDone() {
        if (this.IsValid(this._onVideoRecordingStopEvent)) {
            this._onVideoRecordingStopEvent.Invoke();
        }
        
        WorldVideoRecorder.StopRecording();
        GameObject.Destroy(this._replicaCamera.gameObject);
        this._replicaCamera = null;

        // Publish Camera Change
        this._onCameraChange?.Invoke(this._mainCamera);
    }

    public VideoPostToFeed(feedMessage: string) {
        if (Application.isEditor) {
            this._onFailEvent.Invoke();
        }

        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        WorldVideoRecorder.CreateFeed(feedMessage, (result) => {
            if (result && this.IsValid(this._onSuccessEvent)) {
                this._onSuccessEvent.Invoke();
            }

            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
        });
    }

    public VideoSave() {
        if (Application.isEditor) {
            this._onFailEvent.Invoke();
        }

        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        WorldVideoRecorder.SaveToCameraRoll((result) => {
            if (result) {
                if (result && this.IsValid(this._onSuccessEvent)) {
                    this._onSuccessEvent.Invoke();
                }

                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
        });
    }

    public VideoShare() {
        WorldVideoRecorder.Share((result) => {
            if (result) {
                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
        });
    }

    public DestroyVideoPlayerComponent(playerObject: GameObject) {
        let existingVideoPlayer = playerObject.GetComponent<VideoPlayer>();
        if (existingVideoPlayer != null) {
            existingVideoPlayer.Stop();
            GameObject.Destroy(existingVideoPlayer);
        }
    }

    public PlayPreviewVideo(playerObject: GameObject, width: number, height: number) {
        
        if (this._previewResolution == VideoResolutions.W720xH1280) {
            width = 720;
            height = 1280;
        }
        else if (this._previewResolution == VideoResolutions.W1280xH720) {
            width = 1280;
            height = 720;
        }
        
       let videoPlayer = WorldVideoRecorder.AddVideoPlayerComponent(playerObject, width, height);
        if (videoPlayer == null) {
           return;
       }
        videoPlayer.isLooping = true;
        videoPlayer.Play();
    }
    
    /** -------------------------------------------------------------------------------------------------------- */
    /** Utilities */

    /**
     * Find all materials that belong to a specific render queue
     * @param queue The render queue
     * @returns Material[] Array containing the matching materials
     */
    private FindMaterialsFromQueue(queue: number): Material[] 
    {
        var materials: Material[] = [];
        
        var allRenderers = GameObject.FindObjectsOfType<Renderer>();

        for (const rend of allRenderers)
        {
            for (const mat of rend.sharedMaterials)
            {
                if (mat != null &&                      // null test
                    mat.renderQueue == queue &&         // queue testing
                    !materials.find(x => x === mat))    // unique materials
                            materials.push(mat);
            }
        }
        return materials;
    }

    /**
     * Find all materials from AlphaTestRenderQueue
     * 
     * @returns Material[] Array containing the matching materials
     */
    private FindAlphaTestMaterials(): Material[]
    {
        return this.FindMaterialsFromQueue(ALPHA_TEST_RENDER_QUEUE);
    }
    
    private ResizeRenderTexture(rt: RenderTexture, width: int, height: int) {
        if (rt) rt.Release();
        rt.width = width;
        rt.height = height;
    }
    
    private RotateRenderTexture(rt: RenderTexture) {
        this.ResizeRenderTexture(rt, rt.height, rt.width);
    }
}