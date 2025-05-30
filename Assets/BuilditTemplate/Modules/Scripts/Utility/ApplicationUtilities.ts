import {Application, RuntimePlatform} from 'UnityEngine';

export enum ApplicationPlatform {
    ios,
    android,
    osx,
    windows,
    other
}

export class ApplicationUtilities {

    /**
     * Get the current runtime platform
     */
    public static get currentPlatform(): ApplicationPlatform {

        switch (Application.platform) {
            case RuntimePlatform.IPhonePlayer:
                return ApplicationPlatform.ios;

            case RuntimePlatform.Android:
                return ApplicationPlatform.android;

            case RuntimePlatform.OSXEditor:
                case RuntimePlatform.OSXEditor:
                return ApplicationPlatform.osx;

            case RuntimePlatform.WindowsPlayer:
                case RuntimePlatform.WindowsEditor:
                return ApplicationPlatform.windows;

            default:
                return ApplicationPlatform.other
        }
    }

    /**
     * Is the current platform a mobile device
     */
    public static get isMobile(): boolean {
        switch (Application.platform) {
            case RuntimePlatform.IPhonePlayer:
                case RuntimePlatform.Android:
                return true;
            default:
                return false;
        }
    }

    /**
     * Is the current platform PC (Windows/OSX)
     */
    public static get isPC(): boolean { return !this.isMobile; }

    /**
     * Is the current platform running in Editor
     */
    public static get isEditor(): boolean {
        switch (Application.platform) {
            case RuntimePlatform.OSXEditor: 
                case RuntimePlatform.WindowsEditor:
                return true;

            default:
                return false;
        }
    }
}
