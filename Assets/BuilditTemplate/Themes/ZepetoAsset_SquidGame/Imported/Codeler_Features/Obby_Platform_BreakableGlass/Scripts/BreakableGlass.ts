import { setOriginalNode } from 'typescript';
import { Collider, Debug, ForceMode, GameObject, MeshRenderer, Random, Rigidbody, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class BreakableGlass extends ZepetoScriptBehaviour {


    @SerializeField()
    private _isBreakable: bool = true;
    public get IsBreakable(): bool { return this._isBreakable; }

    private _hasBeenBroken: bool;
    public get HasBeenBroken(): bool { return this._hasBeenBroken; }

    @SerializeField()
    private _brokenGlassPrefab: GameObject;
    private _brokenGlassObject: GameObject;

    @SerializeField()
    private _breakForce: number = 10.0;

    @SerializeField()
    private _resetOnEnable: bool = true;

    @SerializeField()
    private _hasAutoReset: bool = false;
    @SerializeField()
    private _autoResetDelay: number = 3.0;


    private _collider: Collider;
    public get Collider(): Collider { //Safe Get
        if (this._collider == null) {
            this._collider = this.gameObject.GetComponent<Collider>();
            if (!this._collider) {
                Debug.LogError(this.gameObject.name + " (BreakableGlass.ts) = does not have any Collider component!", this.gameObject);
            }
        }
        return this._collider;
    }

    private _meshRenderer: MeshRenderer;
    public get MeshRenderer(): MeshRenderer { //Safe Get
        if (this._meshRenderer == null) {
            this._meshRenderer = this.gameObject.GetComponent<MeshRenderer>();
            if (!this._meshRenderer) {
                Debug.LogError(this.gameObject.name + " (BreakableGlass.ts) = does not have MeshRenderer component!", this.gameObject);

            }
        }
        return this._meshRenderer;
    }

    //Unity Methods /////////////

    Start() {
        this.Initialize();
    }

    OnEnable() {
        if (this._resetOnEnable) {
            this.Reset();
        }
    }


    public OnTriggerEnter(collider: Collider) {
        if (this._isBreakable) { //should apply for everything? sadly players in the build it template do not have any Player tag or Player layer to have an easy check
            this.BreakGlass();
        }
    }

    //////////

    private Initialize() {
        this._hasBeenBroken = false;
        if (this._isBreakable) {
            this.Collider.isTrigger = true; //If breakable, make the trigger interaction possible, otherwise it is just a simple platform!
        }
    }

    //In case of want to control from another script
    public SetBreakable() {
        this._isBreakable = true;
        this.Initialize();
    }


    public BreakGlass() {
        if (this._hasBeenBroken) return; //Dont break twice

        this.GenerateBrokenGlass();
        if (this._hasAutoReset) this.StartCoroutine(this.AutoReset());

        this._hasBeenBroken = true;
    }

    private GenerateBrokenGlass() {
        if (this._brokenGlassPrefab != null) {
            let brokenGlass = GameObject.Instantiate(this._brokenGlassPrefab, this.transform.position, this.transform.rotation) as GameObject;

            // Add a downward force to each rigidbody piece in the broken glass
            let rigidbodies = brokenGlass.GetComponentsInChildren<Rigidbody>();
            for (let i = 0; i < rigidbodies.length; i++) {
                let rb = rigidbodies[i];

                let randomInitVelocity = Random.Range(this._breakForce * 0.65, this._breakForce); //random between 65% and 100% or _breakForce
                rb.velocity = new Vector3(0, -randomInitVelocity, 0);

                // Add random spin
                rb.AddTorque(Vector3.op_Multiply(Random.insideUnitSphere, this._breakForce), ForceMode.Impulse);
            }

            this._brokenGlassObject = brokenGlass;
            this.MeshRenderer.enabled = false; //Make the original not broken glass invisible


        }
        else {
            console.error(this.gameObject.name + " (BreakableGlass.ts) = _brokenGlassPrefab is not assigned!");
        }
    }

    private *AutoReset() {
        yield new WaitForSeconds(this._autoResetDelay);
        this.Reset();
    }

    public Reset() {
        //No need reset if the glass has not broke
        if (!this._hasBeenBroken) return;

        //Reset variables
        this.Initialize();

        //Reactive the original not broken glass mesh
        this.MeshRenderer.enabled = true;

        //Remove the broken pieces
        if (this._brokenGlassObject != null) {
            GameObject.Destroy(this._brokenGlassObject);
        }
    }

}