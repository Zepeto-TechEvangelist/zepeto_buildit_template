//# signature=ZEPETO#ce4aab2bbf55c02894ebc631ad5ee86a#0.0.4
// @ts-nocheck
declare module 'Zepeto' {

    import * as UnityEngine from 'UnityEngine';
    import * as RootNamespace from 'RootNamespace';
    import * as System from 'System';
    import * as Zepeto_ZepetoContext from 'Zepeto.ZepetoContext';
    import * as Zepeto_ZepetoMetadata from 'Zepeto.ZepetoMetadata';
    import * as System_Collections_Generic from 'System.Collections.Generic';
    import * as Zepeto_ZepetoAssetRequest from 'Zepeto.ZepetoAssetRequest';


    class ZepetoContext extends UnityEngine.MonoBehaviour {

        public Metadata: ZepetoMetadata;
        
        public get IsContentLoading(): boolean;

        public constructor();

        public ApplyMetadata($metadata: ZepetoMetadata): void;

        public WaitContentLoading(): UnityEngine.WaitWhile;

        public WaitApplyMetadata($metadata: ZepetoMetadata): UnityEngine.WaitWhile;

        public WaitApplyMetadata($jsonMetadata: string): UnityEngine.WaitWhile;

        public WaitApplyMetadataWithCleanup($metadata: ZepetoMetadata): UnityEngine.CustomYieldInstruction;

    }

    class ZepetoMetadata extends System.Object {

        public constructor();

        public Get($property: ZepetoPropertyFlag): string;

        public Set($property: ZepetoPropertyFlag, $value: string): void;
        
    }

    enum ZepetoPropertyFlag { None = 0, Skin = 1, SkinTone = 2, SkinDetail = 3, Face = 4, Eye = 5, EyeLens = 6, Eyebrow = 7, Beard = 8, Mustache = 9, EyeShadow = 10, EyeLiner = 11, EyeLash = 12, Blusher = 13, Nose = 14, Mouth = 15, Lips = 16, Hair = 17, ClothesGlasses = 18, ClothesTop = 19, ClothesBottom = 20, ClothesShoes = 21, ClothesDress = 22, Background = 23, RoomWallpaper = 24, RoomFloor = 25, RoomBottom = 26, RoomTopLeft = 27, RoomTopRight = 28, RoomMiddleLeft = 29, RoomMiddleRight = 30, Point = 31, Freckles = 32, FaceHair = 33, DoubleEyelid = 34, NailArt = 35, ClothesSocks = 36, ClothesGlove = 37, AccessoryBracelet = 38, AccessoryNecklace = 39, AccessoryEarring = 40, AccessoryRing = 41, AccessoryHeadwear = 42, AccessoryPiercing = 43, BoothBackground = 44, LUT = 45, AccessoryMask = 46, FacePainting = 47, AccessoryBag = 48, AccessoryWing = 49, ClothesCape = 50, ClothesExtra = 51, MannequinFace = 52, WrinkleForehead = 53, WrinkleEye = 54, WrinkleMouth = 55, DoubleEyelidBottom = 56, WrinkleMongo = 57, AccessoryTail = 58, AccessoryEffect = 59, ClothesDeform = 60, HairExtensions = 61, MakeupSet = 62 }

}
