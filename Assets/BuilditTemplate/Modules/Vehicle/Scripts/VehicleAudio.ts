import {
    Object,
    Transform,
    GameObject,
    Quaternion,
    Vector3,
    HumanBodyBones,
    AnimationClip,
    Animator,
    MeshCollider,
    RuntimeAnimatorController,
    AnimatorOverrideController,
    AudioSource, AudioClip, Random
} from 'UnityEngine'
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {IList$1} from 'System.Collections.Generic';


export enum EngineAudioOptions // Options for the engine audio
{
    Simple, // Simple style audio
    FourChannel // four Channel audio
}

/**
 * Component that controls the vehicle object state, including animations blending and effects.
 * It provides a configuration for a vehicle object so it is usually attached to the verhicle root.
 */
export default class VehicleAudio extends ZepetoScriptBehaviour {

    // This script reads some of the car's current properties and plays sounds accordingly.
    // The engine sound can be a simple single clip which is looped and pitched, or it
    // can be a crossfaded blend of four clips which represent the timbre of the engine
    // at different RPM and Throttle state.

    // the engine clips should all be a steady pitch, not rising or falling.

    // when using four channel engine crossfading, the four clips should be:
    // lowAccelClip : The engine at low revs, with throttle open (i.e. begining acceleration at very low speed)
    // highAccelClip : Thenengine at high revs, with throttle open (i.e. accelerating, but almost at max speed)
    // lowDecelClip : The engine at low revs, with throttle at minimum (i.e. idling or engine-braking at very low speed)
    // highDecelClip : Thenengine at high revs, with throttle at minimum (i.e. engine-braking at very high speed)

    // For proper crossfading, the clips pitches should all match, with an octave offset between low and high.
    

    private engineSoundStyle: EngineAudioOptions = EngineAudioOptions.Simple;     // Set the default audio options to be four channel
    @HideInInspector() public  lowAccelClip: AudioClip;                                              // Audio clip for low acceleration
    @HideInInspector() public  lowDecelClip: AudioClip;                                              // Audio clip for low deceleration
    public  highAccelClip: AudioClip;                                             // Audio clip for high acceleration
    @HideInInspector() public  highDecelClip: AudioClip;                                             // Audio clip for high deceleration
    public  pitchMultiplier: float = 1;                                          // Used for altering the pitch of audio clips
    public  lowPitchMin: float = 1;                                              // The lowest possible pitch for the low sounds
    public  lowPitchMax: float = 6;                                              // The highest possible pitch for the low sounds
    public  highPitchMultiplier: float = 0.25;                                   // Used for altering the pitch of high sounds
    public  maxRolloffDistance: float = 500;                                      // The maximum distance where rollof starts to take place
    public  dopplerLevel: float = 1;                                              // The mount of doppler effect used in the audio
    public  useDoppler: bool = true;                                              // Toggle for using doppler

    private  m_LowAccel: AudioSource; // Source for the low acceleration sounds
    private  m_LowDecel: AudioSource; // Source for the low deceleration sounds
    private  m_HighAccel: AudioSource; // Source for the high acceleration sounds
    private  m_HighDecel: AudioSource; // Source for the high deceleration sounds
    private  m_StartedSound: bool; // flag for knowing if we have started sounds


    public StartSound()
    {
        if (this.m_StartedSound) 
            return;
        
        // setup the simple audio source
        this.m_HighAccel = this.SetUpEngineAudioSource(this.highAccelClip);

        // flag that we have started the sounds playing
        this.m_StartedSound = true;
    }


    public StopSound()
    {
        Object.Destroy(this.m_HighAccel);
        this.m_HighAccel = null;

        this.m_StartedSound = false;
    }


    // Update is called once per frame
    public SpeedUpdate(value: float)
    {
        
        if (!this.m_StartedSound && value > 0) {
            this.StartSound();
        }
        
        // Different triggers here, based on speed etc

        if (this.m_StartedSound)
        {
            // Speed value

            // The pitch is interpolated between the min and max values, according to the car's revs.
            var pitch: float = VehicleAudio.ULerp(this.lowPitchMin, this.lowPitchMax, value);

            pitch = Math.min(this.lowPitchMax, pitch);

            this.m_HighAccel.pitch = pitch*this.pitchMultiplier*this.highPitchMultiplier;
            this.m_HighAccel.dopplerLevel = this.useDoppler ? this.dopplerLevel : 0;
            this.m_HighAccel.volume = 1;
        }
    }


    // sets up and adds new audio source to the gane object
    private SetUpEngineAudioSource(clip: AudioClip): AudioSource
    {
        // create the new audio source component on the game object and set up its properties
        const source = this.gameObject.AddComponent<AudioSource>();
        source.clip = clip;
        source.volume = 0;
        source.spatialBlend = 0;//1;
        source.loop = true;

        // start the clip from a random point
        source.time = Random.Range(0, clip.length);
        source.Play();
        source.minDistance = 5;
        source.maxDistance = 5.1;//this.maxRolloffDistance;
        source.dopplerLevel = 0;
        return source;
    }
    
    
    // unclamped versions of Lerp and Inverse Lerp, to allow value to exceed the from-to range
    private static ULerp( from: float,  to: float,  value: float): float
    {
        return (1.0 - value) * from + value * to;
    }
}
