// @ts-nocheck
declare module "ZEPETO.Script" {
    import * as UnityEngine from "UnityEngine";
    import * as System from "System";
    import * as ZEPETO_Script_ZepetoScriptInstance from "ZEPETO.Script.ZepetoScriptInstance";

    class ZepetoScriptBehaviourComponent extends UnityEngine.MonoBehaviour {
        public script: ZepetoScriptInstance;

        public constructor();

        public Invoke($method: string): void;

        public Invoke($method: string, $time: number): void;

        public CancelInvoke(): void;

        public CancelInvoke($method: string): void;

        public InvokeEvent($events: ZEPETO_Script_ZepetoScriptInstance.Events, $param?: any): void;
    }

    class ZepetoScriptInstance extends System.Object {
        
        public context: ZepetoScriptContext;
        
        public get Script(): JavascriptAsset;

        public get Name(): string;

        public get Description(): string;

        public constructor();

        public EnsureInstance($ctx: ZepetoScriptContext): ZepetoScriptBehaviour;
        
    }
}
