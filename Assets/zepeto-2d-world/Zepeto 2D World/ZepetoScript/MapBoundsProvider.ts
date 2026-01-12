// Assets/Scripts/Camera/MapBoundsProvider.ts
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';

/**
 * Marker component: “This GameObject is a map root for camera bounds.”
 *
 * WorldManager (singleton) scans all active providers on Awake and manages
 * which one is active. This component does not auto-register anymore.
 */
export default class MapBoundsProvider extends ZepetoScriptBehaviour {
    // Intentionally empty – it’s just a tag/marker.
}