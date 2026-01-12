// GestureThumbnailBinder.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoPlayers, CharacterState } from 'ZEPETO.Character.Controller';
import { Button } from 'UnityEngine.UI';
import { GameObject, WaitForSeconds, Coroutine, Transform, WaitForEndOfFrame } from 'UnityEngine';
import GestureLoader from '../../../BuilditTemplate/Modules/Gesture/ZepetoScript/GestureLoader';

// GestureLoader를 수정하지 않고, 외부에서 썸네일 버튼에 onClick을 추가로 바인딩한다.
// - thumbnails 배열은 비동기로 채워지므로, 주기적으로 훑어서 '새로 생긴' 썸네일만 바인딩한다.
// - onClick 순서는 '나중에 추가된 리스너가 나중에 실행'되므로,
//   기존 LoadAnimation(...) 이후에 ChangeStateAnimation(Gesture)가 호출된다.
// - 혹시 순서 경합이 우려되면, 클릭 콜백에서 한 프레임 뒤에 상태 전환을 호출한다(WaitForEndOfFrame).

export default class GestureThumbnailBinder extends ZepetoScriptBehaviour {

    /** 드래그해서 할당할 GestureLoader (필수) */
    public loaderObj: GameObject;

    /** 새 버튼을 주기적으로 스캔하는 간격(sec) */
    public scanInterval: number = 0.2;

    private _boundSet = new Set<GameObject>();
    private _scanRoutine: Coroutine | null = null;

    Start() {
        this._scanRoutine = this.StartCoroutine(this.ScanAndBindLoop());
    }

    private *ScanAndBindLoop() {
        // GestureLoader 컴포넌트 찾기
        const loader = this.loaderObj ? this.loaderObj.GetComponent<GestureLoader>() : null;
        if (!loader) {
            console.warn("[GestureThumbnailBinder] loaderObj is missing or has no component.");
            return;
        }

        while (true) {
            // 1) loader.thumbnails 배열 기반으로 새 항목만 바인딩
            const arr: GameObject[] = (loader.thumbnails ?? []) as GameObject[];
            for (let i = 0; i < arr.length; i++) {
                const go = arr[i];
                if (!go || this._boundSet.has(go)) continue;

                const btn = go.GetComponent<Button>() as Button;
                if (btn) {
                    btn.onClick.AddListener(() => this.OnThumbClicked());
                    this._boundSet.add(go);
                }
            }

            yield new WaitForSeconds(Math.max(0.05, this.scanInterval));
        }
    }

    /** 썸네일 클릭 시, 기존 LoadAnimation 이후에 제스처 상태로 전환한다. */
    private *ChangeStateNextFrame() {
        // Ensure LoadAnimation(...) finished this frame before state change
        yield new WaitForEndOfFrame();

        const local = ZepetoPlayers.instance?.LocalPlayer;
        const character = local?.zepetoPlayer?.character;
        if (!character) return;

        try {
            character.ChangeStateAnimation(CharacterState.Gesture);
        } catch (e) {
            console.warn("[GestureThumbnailBinder] ChangeStateAnimation(Gesture) failed:", e);
        }
    }

    private OnThumbClicked() {
        // 프레임 경합 방지: 한 프레임 뒤에 상태 전환
        this.StartCoroutine(this.ChangeStateNextFrame());
    }
}