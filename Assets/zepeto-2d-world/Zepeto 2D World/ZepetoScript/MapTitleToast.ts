// MapTitleToast.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { GameObject, Time, CanvasGroup, WaitForSeconds, Screen } from 'UnityEngine';
import { TextMeshProUGUI } from 'TMPro';
import Localization from '../../../BuilditTemplate/Modules/Localization/ZepetoScript/Localization';

export default class MapTitleToast extends ZepetoScriptBehaviour {
    
    // Portrait mode (vertical screen)
    public portraitToastObject: GameObject | null = null;
    public portraitTitleText: TextMeshProUGUI | null = null;
    
    // Landscape mode (horizontal screen)
    public landscapeToastObject: GameObject | null = null;
    public landscapeTitleText: TextMeshProUGUI | null = null;
    
    public fadeInDuration: number = 0.5;
    public displayDuration: number = 2.0;
    public fadeOutDuration: number = 0.5;
    
    private _portraitCanvasGroup: CanvasGroup | null = null;
    private _landscapeCanvasGroup: CanvasGroup | null = null;
    private _isAnimating: boolean = false;
    private _currentMode: 'portrait' | 'landscape' = 'landscape';

    Awake() {
        // Ensure CanvasGroup for portrait toast
        if (this.portraitToastObject) {
            this._portraitCanvasGroup = this.portraitToastObject.GetComponent<CanvasGroup>();
            if (!this._portraitCanvasGroup) {
                this._portraitCanvasGroup = this.portraitToastObject.AddComponent<CanvasGroup>();
            }
            this._portraitCanvasGroup.alpha = 0;
            this.portraitToastObject.SetActive(false);
        }
        
        // Ensure CanvasGroup for landscape toast
        if (this.landscapeToastObject) {
            this._landscapeCanvasGroup = this.landscapeToastObject.GetComponent<CanvasGroup>();
            if (!this._landscapeCanvasGroup) {
                this._landscapeCanvasGroup = this.landscapeToastObject.AddComponent<CanvasGroup>();
            }
            this._landscapeCanvasGroup.alpha = 0;
            this.landscapeToastObject.SetActive(false);
        }
    }

    /** Show toast with given text, then auto-hide. Automatically selects portrait/landscape mode. */
    public ShowToast(text: string) {
        if (this._isAnimating) {
            // If already animating, stop previous and restart
            this.StopAllCoroutines();
        }
        
        // Determine current screen orientation based on aspect ratio
        const aspectRatio = Screen.width / Screen.height;
        const isPortrait = aspectRatio < 1.0;
        this._currentMode = isPortrait ? 'portrait' : 'landscape';
        
        console.log(`[MapTitleToast] Screen: ${Screen.width}x${Screen.height}, Aspect: ${aspectRatio.toFixed(2)}, Mode: ${this._currentMode}`);

        
        if (this.portraitTitleText) {
            this.portraitTitleText.text = text; //Localization.instance.GetLocalizedText(text);
        }
        if (this.landscapeTitleText) {
            this.landscapeTitleText.text = text; //Localization.instance.GetLocalizedText(text);;
        }
        
        
        // Set text and activate appropriate toast
        if (this._currentMode === 'portrait') {
            
            if (this.portraitToastObject) {
                this.portraitToastObject.SetActive(true);
            }
            if (this.landscapeToastObject) {
                this.landscapeToastObject.SetActive(false);
            }
        } else {
            
            if (this.landscapeToastObject) {
                this.landscapeToastObject.SetActive(true);
            }
            if (this.portraitToastObject) {
                this.portraitToastObject.SetActive(false);
            }
        }
        
        this.StartCoroutine(this.AnimateToast());
    }

    /** Fade in → hold → fade out sequence. */
    private *AnimateToast(): IterableIterator<any> {
        this._isAnimating = true;
        
        const canvasGroup = this._currentMode === 'portrait' ? this._portraitCanvasGroup : this._landscapeCanvasGroup;
        if (!canvasGroup) {
            this._isAnimating = false;
            return;
        }
        
        // 1) Fade In
        yield* this.FadeIn(canvasGroup);
        
        // 2) Hold/Display
        yield new WaitForSeconds(this.displayDuration);
        
        // 3) Fade Out
        yield* this.FadeOut(canvasGroup);
        
        // 4) Disable after animation
        if (this._currentMode === 'portrait' && this.portraitToastObject) {
            this.portraitToastObject.SetActive(false);
        } else if (this._currentMode === 'landscape' && this.landscapeToastObject) {
            this.landscapeToastObject.SetActive(false);
        }
        this._isAnimating = false;
    }

    private *FadeIn(canvasGroup: CanvasGroup): IterableIterator<any> {
        if (!canvasGroup) return;
        
        let elapsed = 0;
        while (elapsed < this.fadeInDuration) {
            elapsed += Time.deltaTime;
            const t = elapsed / this.fadeInDuration;
            canvasGroup.alpha = t;
            yield null;
        }
        canvasGroup.alpha = 1;
    }

    private *FadeOut(canvasGroup: CanvasGroup): IterableIterator<any> {
        if (!canvasGroup) return;
        
        let elapsed = 0;
        while (elapsed < this.fadeOutDuration) {
            elapsed += Time.deltaTime;
            const t = elapsed / this.fadeOutDuration;
            canvasGroup.alpha = 1 - t;
            yield null;
        }
        canvasGroup.alpha = 0;
    }

    /** Immediately hide the toast (stop animation). */
    public Hide() {
        this.StopAllCoroutines();
        
        if (this._portraitCanvasGroup) this._portraitCanvasGroup.alpha = 0;
        if (this._landscapeCanvasGroup) this._landscapeCanvasGroup.alpha = 0;
        
        if (this.portraitToastObject) this.portraitToastObject.SetActive(false);
        if (this.landscapeToastObject) this.landscapeToastObject.SetActive(false);
        
        this._isAnimating = false;
    }
}

