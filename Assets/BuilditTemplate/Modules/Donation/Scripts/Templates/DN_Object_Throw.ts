import {DonationTimedActionBase} from "../DonationActionBase"
import {
    ForceMode,
    GameObject,
    HumanBodyBones,
    Object,
    Physics,
    Rigidbody,
    Transform,
    Vector3,
    WaitForEndOfFrame
} from 'UnityEngine';
import AE_Object_Spawner from "../../../Scripts/InteractionSystem/Actions/AE_Object_Spawner";
import {DonationEventData} from "../Types";
import {KnowSockets, ZepetoPlayers} from "ZEPETO.Character.Controller";


export default class DN_Object_Throw extends DonationTimedActionBase
{
    @Tooltip("Prefab of the thrown object")
    public sourceObject: Object;
    
    @Tooltip("Parent object for new instances")
    public throwTarget: HumanBodyBones = HumanBodyBones.Head;

    @Tooltip("Position offset from the target")
    public positionOffset: Vector3;

    @Tooltip("Parent object for new instances")
    public spawnParent: Transform;
    
    @Tooltip("Force with which the object is thrown")
    private throwForce: number = 2.2;
    
    private ae: AE_Object_Spawner;
    
    private get targetBoneTransform():Transform { 
        return ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character
            .ZepetoAnimator.GetBoneTransform(this.throwTarget) 
    }
    
    
    Start() {
        super.Start();
        this.ae = this.GetComponentInChildren<AE_Object_Spawner>();
        
        this.ae.onCreate = (object: Object) => {
            this.StartCoroutine(this.OnCreate(object as GameObject));
            
        };

        this.throwForce = 2.2;
        
        this.ae.Init();
    }
    
    *OnCreate(instance: GameObject) {

        yield new WaitForEndOfFrame();

        const sourcePoint = ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.transform;
        
        instance.name = "ThrownObject";
        instance.transform.position = sourcePoint.position;

        yield new WaitForEndOfFrame(); // Wait for update
        
        var rb = instance.GetComponent<Rigidbody>() ?? instance.AddComponent<Rigidbody>();
        const targetTransform = this.targetBoneTransform;

        if (rb != null)
        {
            // Force adjustment
            const source = sourcePoint.position;
            const target = targetTransform.position + this.positionOffset;
            const direction: Vector3 = target - source;
            const distance: float = direction.magnitude;
            
            var throwDirection: Vector3;
            if (targetTransform != null)
            {
                
                
                throwDirection = (targetTransform.position + this.positionOffset - sourcePoint.position + new Vector3(0, 1.0, 0)).normalized; 
                    //this.calcBallisticVelocityVector(sourcePoint.position, targetTransform.position + this.positionOffset, this.throwForce);
            }
            else
            {
                throwDirection = sourcePoint.forward;
            }

            // Force adjustment
            // const source = sourcePoint.position;
            // const target = targetTransform.position + this.positionOffset;
            // const direction: Vector3 = target - source;
            // const distance: float = direction.magnitude;
            
            // rb.velocity = throwDirection;
            rb.AddForce(throwDirection * (this.throwForce * distance), ForceMode.Impulse);
        }
    }

    // Internal calculations
    private calcBallisticVelocityVector(source: Vector3, target: Vector3, angle: number): Vector3
    {
        var direction: Vector3 = target - source;			// get target direction
        const h = direction.y;											// Displacement Y for angle
        direction.y = 0;												// remove height
        let distance: float = direction.magnitude;							// get horizontal distance
        let a: float = angle * (Math.PI / 180.0);								// Convert angle to radians
        direction.y = distance * Math.tan(a);							// Set direction to elevation angle
        distance += h/Math.tan(a);										// Correction for small height differences

        // calculate velocity
        var velocity = Math.sqrt(distance * Physics.gravity.magnitude / Math.sin(2*a));
        return velocity * direction.normalized;
    }
    

    DoAction(data: DonationEventData) {

        this.ae.targetObject = this.sourceObject;
        this.ae.targetLocation = this.spawnParent;
        this.ae.duration = this.duration;
        
        super.DoAction();
    }
}