import {ZepetoPropertyFlag} from 'Zepeto';

// export enum WardrobeItemKeyword {
//     outwear = ItemKeyword.outwear,
//     top = ItemKeyword.top,
//     pants = ItemKeyword.pants,
//     skirt = ItemKeyword.skirt,
//     onepiece = ItemKeyword.onepiece,
//     footwear = ItemKeyword.footwear,
//     accesory = ItemKeyword.accessory,
//     jewelry = ItemKeyword.jewelry,
//     headwear = ItemKeyword.headwear,
//     eyewear = ItemKeyword.eyewear,
//     socks = ItemKeyword.socks,
//     makeup = ItemKeyword.makeup,
//     hair = ItemKeyword.hair,
//     bodyfigure = ItemKeyword.bodyfigure
// }

/**
 * Values corespond to ItemKeyword
 */
export enum WardrobeItemKeyword {
    
    /**
     * Hair
     */
    hair = 1,
    /**
     * Dress
     */
    onepiece = 2,
    /**
     * Top
     */
    top = 3,
    /**
     * All
     */
    outwear = 4,
    /**
     * Pants
     */
    pants = 5,
    /**
     * Skirt
     */
    skirt = 6,
    /**
     * Socks
     */
    socks = 7,
    /**
     * Footwear
     */
    footwear = 8,
    /**
     * Headwear
     */
    headwear = 9,
    /**
     * Eyewear
     */
    eyewear = 10,
    /**
     * Jewelry
     */
    jewelry = 11,
    /**
     * Makeup
     */
    makeup = 12,
    /**
     * Accessory
     */
    accessory = 13,
    /**
     * Body Type
     */
    bodyfigure = 14,
}
//
// interface WardrobeItemKeyToZepetoPropertyMap {
//     [key: WardrobeItemKeyword]: ZepetoPropertyFlag;
// }

// type WardrobeZepetoProperty = {
//     [Keyword in WardrobeItemKeyword]: {
//         name: F;
//     };
// };

const wardrobePropertyMap: Record<WardrobeItemKeyword, ZepetoPropertyFlag[]> = {
    [WardrobeItemKeyword.hair]: [ZepetoPropertyFlag.Hair],
    /**
     * Dress
     */
    [WardrobeItemKeyword.onepiece]: [ZepetoPropertyFlag.ClothesDress],
    /**
     * Top
     */
    [WardrobeItemKeyword.top]: [ZepetoPropertyFlag.ClothesTop],
    /**
     * All
     */
    [WardrobeItemKeyword.outwear]: [ZepetoPropertyFlag.ClothesCape],
    /**
     * Pants
     */
    [WardrobeItemKeyword.pants]: [ZepetoPropertyFlag.ClothesBottom],
    /**
     * Skirt
     */
    [WardrobeItemKeyword.skirt]: [ZepetoPropertyFlag.ClothesDress],
    /**
     * Socks
     */
    [WardrobeItemKeyword.socks]: [ZepetoPropertyFlag.ClothesSocks],
    /**
     * Footwear
     */
    [WardrobeItemKeyword.footwear]: [ZepetoPropertyFlag.ClothesShoes],
    /**
     * Headwear
     */
    [WardrobeItemKeyword.headwear]: [ZepetoPropertyFlag.AccessoryHeadwear],
    /**
     * Eyewear
     */
    [WardrobeItemKeyword.eyewear]: [ZepetoPropertyFlag.ClothesGlasses],
    /**
     * Jewelry
     */
    [WardrobeItemKeyword.jewelry]: [ZepetoPropertyFlag.None],
    /**
     * Makeup
     */
    [WardrobeItemKeyword.makeup]: [ZepetoPropertyFlag.EyeShadow, ZepetoPropertyFlag.EyeLiner, ZepetoPropertyFlag.EyeLash, ZepetoPropertyFlag.Blusher, ZepetoPropertyFlag.MakeupSet, ZepetoPropertyFlag.NailArt, ZepetoPropertyFlag.FacePainting, ZepetoPropertyFlag.FaceContouring, ZepetoPropertyFlag.SkinDetail],
    /**
     * Accessory
     */
    [WardrobeItemKeyword.accessory]: [ZepetoPropertyFlag.AccessoryWing, ZepetoPropertyFlag.AccessoryHeadwear],
    /**
     * Body Type
     */
    [WardrobeItemKeyword.bodyfigure]: [ZepetoPropertyFlag.None],
};

export function WardrobeKeywordToZepetoPropertyFlag(keyword: WardrobeItemKeyword): ZepetoPropertyFlag[] {
    return wardrobePropertyMap[keyword] || [];
}

// EyeShadow = 10, EyeLiner = 11, EyeLash = 12, Blusher
// enum ZepetoPropertyFlag { None = 0, Skin = 1, SkinTone = 2, SkinDetail = 3, Face = 4, Eye = 5, EyeLens = 6, Eyebrow = 7, Beard = 8, Mustache = 9, EyeShadow = 10, EyeLiner = 11, EyeLash = 12, Blusher = 13, Nose = 14, Mouth = 15, Lips = 16, Hair = 17, ClothesGlasses = 18, ClothesTop = 19, ClothesBottom = 20, ClothesShoes = 21, ClothesDress = 22, Background = 23, RoomWallpaper = 24, RoomFloor = 25, RoomBottom = 26, RoomTopLeft = 27, RoomTopRight = 28, RoomMiddleLeft = 29, RoomMiddleRight = 30, Point = 31, Freckles = 32, FaceHair = 33, DoubleEyelid = 34, NailArt = 35, ClothesSocks = 36, ClothesGlove = 37, AccessoryBracelet = 38, AccessoryNecklace = 39, AccessoryEarring = 40, AccessoryRing = 41, AccessoryHeadwear = 42, AccessoryPiercing = 43, BoothBackground = 44, LUT = 45, AccessoryMask = 46, FacePainting = 47, AccessoryBag = 48, AccessoryWing = 49, ClothesCape = 50, ClothesExtra = 51, MannequinFace = 52, WrinkleForehead = 53, WrinkleEye = 54, WrinkleMouth = 55, DoubleEyelidBottom = 56, WrinkleMongo = 57, AccessoryTail = 58, AccessoryEffect = 59, ClothesDeform = 60, HairExtensions = 61, MakeupSet = 62, FaceContouring = 63, BaseModel = 64, CreatorLens = 65, BaseDeformer = 66 }
    