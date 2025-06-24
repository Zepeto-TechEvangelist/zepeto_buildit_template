/** JSON을 stringify 또는 parse 할 때, Map과 Set을 자동으로 처리해주는 유틸 */
export default class JSONSerializer {
    private static readonly _keyForMap = "Map";
    private static readonly _keyForSet = "Set";

    public static Stringify(object: any) {
        return JSON.stringify(object, JSONSerializer.Replacer);
    }

    public static Parse<T>(object: string): T {
        return JSON.parse(object, JSONSerializer.Reviver) as T;
    }

    public static Replacer(key: any, value: any) {
        if (value instanceof Map) {
            return {
                dataType: JSONSerializer._keyForMap,
                value: Array.from(value.entries()),
            };
        } else if (value instanceof Set) {
            return {
                dataType: JSONSerializer._keyForSet,
                value: Array.from(value),
            };
        } else {
            return value;
        }
    }

    public static Reviver(key: any, value: any) {
        if (typeof value === "object" && value !== null) {
            if (value.dataType === JSONSerializer._keyForMap) {
                return new Map(value.value);
            } else if (value.dataType === JSONSerializer._keyForSet) {
                return new Set(value.value);
            }
        }
        return value;
    }
}
