import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import EventOnTrigger from './EventOnTrigger'
import { Debug, GameObject, Time, WaitForSeconds, Animator } from 'UnityEngine';
import { UnityEvent, UnityEvent$1 } from 'UnityEngine.Events';
import { Text } from 'UnityEngine.UI';

export default class RaceTimer extends ZepetoScriptBehaviour {

    @SerializeField()
    private _raceStartEventTrigger: GameObject;

    @SerializeField()
    private _raceEndEventTrigger: GameObject;

    private _isRacing: bool;

    private _timer: float;
    private _lastFlooredTimer: float;


    public OnRaceTimerChangedDigit: UnityEvent$1<float>;
    public OnRaceTimerChanged: UnityEvent$1<float>;

    @SerializeField()
    public OnRaceStart: UnityEvent;

    @SerializeField()
    public OnRaceEnd: UnityEvent; //to use in inspector

    public OnRaceEndWithTimerData: UnityEvent$1<float>; //to use in script, it sends the timer on race end


    @SerializeField()
    private _usePrefab: bool = false;
    @SerializeField()
    private _prefabTextUGUI: GameObject;
    @SerializeField()
    private _prefabAutoDestroyOnRaceEnd: bool = true;
    @SerializeField()
    private _prefabDestroyDelay: float = 5.0;
    private _currentTimerText: Text;

    @SerializeField()
    private _useCustom: bool = false;
    @SerializeField()
    private _customTextGUI: Text;

    public get CurrentTextUGUI(): Text {
        if (this._usePrefab) {
            return this._currentTimerText;
        }
        else if (this._useCustom) {
            return this._customTextGUI;
        }
        return null;
    }

    //Unity Methods /////////////

    Awake() {
        this.Initialize();
    }


    Update() {
        if (!this._isRacing) return;

        this.UpdateRace();
    }

    //////////

    private Initialize() {
        this._isRacing = false;
        this.OnRaceTimerChanged = new UnityEvent$1<float>();
        this.OnRaceTimerChangedDigit = new UnityEvent$1<float>();
        this.OnRaceEndWithTimerData = new UnityEvent$1<float>();
        this.BindEvents();
    }

    //Lazy bind on component
    private BindEvents() {
        EventOnTrigger.BindEvent(this._raceStartEventTrigger, () => this.StartRace());
        EventOnTrigger.BindEvent(this._raceEndEventTrigger, () => this.EndRace());
    }

    private GenerateCustomTimer() {
        //Check if prefab is assigned
        if (this._prefabTextUGUI == null) {
            Debug.LogError(this.gameObject.name + " (RaceTimer.ts) = _prefabTextUGUI is not assigned", this.gameObject);
            return;
        }

        //if previous timer is still alive, stop auto destroy coroutines and destroy object
        if (this._currentTimerText != null) {
            GameObject.Destroy(this._currentTimerText.transform.root.gameObject);
            if (this._prefabAutoDestroyOnRaceEnd) this.StopAllCoroutines();
        }

        let go = GameObject.Instantiate(this._prefabTextUGUI) as GameObject;
        this._currentTimerText = go.GetComponentInChildren<Text>();

        //Check if it finds UGUI
        if (this._currentTimerText == null) {
            Debug.LogError(go + " (RaceTimer.ts) = _currentTimerText does not have TextMeshProUGUI component in its children!", go);
        }
    }

    //Generate the UGUI if prefab based
    public SetUpGUI() {
        if (this._usePrefab) {
            this.GenerateCustomTimer();
            //Auto destroy prefab on race end callback
            if (this._prefabAutoDestroyOnRaceEnd) {
                this.OnRaceEnd.AddListener(() => {
                    this.StartCoroutine(this.PrefabAutoDestroy());
                });
            }
        }
        else if (this._useCustom) {
            if (this._customTextGUI == null) {
                Debug.LogError(this.gameObject.name + " (RaceTimer.ts) = _customTextGUI is not assigned", this.gameObject);
            }
        }


        //Bind local event to the current used text ugui if there is
        if (this.CurrentTextUGUI != null) {
            this.OnRaceTimerChangedDigit.AddListener((timer) => {
                this.CurrentTextUGUI.text = RaceTimer.ConvertTimeToMinutesAndSeconds(timer);
            });
        }
    }

    public StartRace() {
        if (this._isRacing) return;

        this._timer = 0.0;
        this._lastFlooredTimer = 0.0;
        this._isRacing = true;
        this.SetUpGUI();

        console.log(this.OnRaceStart.GetPersistentEventCount());
        this.OnRaceStart.Invoke();
    }

    private UpdateRace() {
        //Update timer
        this._timer += Time.deltaTime;
        this.OnRaceTimerChanged.Invoke(this._timer);

        //Update timer on digit changed
        //Usually used for updating the timer on the UI, as we usually display it as seconds, for optimization issues, it is better to use this
        let timerFloored = Math.floor(this._timer);
        if (this._lastFlooredTimer != timerFloored) {
            this._lastFlooredTimer = timerFloored;
            this.OnRaceTimerChangedDigit.Invoke(this._lastFlooredTimer);
        }
    }

    public PauseRace() {
        this._isRacing = false;
    }

    public ResumeRace() {
        this._isRacing = true;
    }


    public EndRace() {
        if (!this._isRacing) return;

        this._isRacing = false;

        console.log(this.OnRaceEnd.GetPersistentEventCount());
        this.OnRaceEnd.Invoke();
        this.OnRaceEndWithTimerData.Invoke(this._timer);
    }


    //Auto destroy coroutine of timer prefab, if used
    private *PrefabAutoDestroy() {
        if (this._currentTimerText != null) {
            yield new WaitForSeconds(this._prefabDestroyDelay);
            let disappearAnimLength = 0.35;

            let animator = this._currentTimerText.transform.root.gameObject.GetComponent<Animator>(); //if based on the original prefab
            if (animator != null) {
                animator.SetTrigger("Disappear");
            }
            else {
                disappearAnimLength = 0.0;
            }

            GameObject.Destroy(this._currentTimerText.transform.root.gameObject, this._prefabDestroyDelay + disappearAnimLength);
        }

    }


    public static ConvertTimeToMinutesAndSeconds(seconds: number): string {
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = Math.floor(seconds % 60);

        //Simple formatting
        let minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
        let secondsStr = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds.toString();

        return minutesStr + ":" + secondsStr;
    }

}