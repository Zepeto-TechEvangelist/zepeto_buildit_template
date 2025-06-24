export const enum Constant {
    ONE_SECOND = 1000,
    ONE_MINUTE = ONE_SECOND * 60,
    ONE_HOUR = ONE_MINUTE * 60,
    ONE_DAY = ONE_HOUR * 24,
    DAILY_INIT_HOUR = 15, // 일반적으로 UTC+9 기준으로 00시 초기화 되어야 하므로 UTC 기준 15시를 초기화 시각으로 잡는다.
}

export class MathUtils {
    private static readonly _randomStringRange = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwyxz1234567890";

    public static Clamp(value: number, min: number, max: number): number {
        return value < min ? min : value > max ? max : value;
    }

    public static InverseLerp(x: number, y: number, value: number): number {
        if (x !== y) {
            return (value - x) / (y - x);
        } else {
            return 0;
        }
    }

    public static Lerp(x: number, y: number, t: number): number {
        return (1 - t) * x + t * y;
    }

    public static Smoothstep(x: number, min: number, max: number): number {
        if (x > min) {
            if (x < max) {
                x = (x - min) / (max - min);
                return x * x * (3 - 2 * x);
            }
            return 1;
        }
        return 0;
    }

    public static Smootherstep(x: number, min: number, max: number): number {
        if (x > min) {
            if (x < max) {
                x = (x - min) / (max - min);
                return x * x * x * (x * (x * 6 - 15) + 10);
            }
            return 1;
        }
        return 0;
    }

    /** 소숫점 자릿수를 고정한다. 기본 toFixed()함수는 무겁기 때문에 성능 최적화를 위해 별도 함수 구현.
     ** toFixed()처럼 자릿수를 1,2,3,.. 식으로 받는대신 1,10,100,.. 식으로 받는다.
     ** 예)
     ** * ToFixed(0.45678, 1); // 0
     ** * ToFixed(0.45678, 10); // 0.5
     ** * ToFixed(0.45678, 100); // 0.46
     ** * ToFixed(0.45678, 1000); // 0.457
     */
    public static ToFixed(num: number, digits: number): number {
        return Math.round(num * digits) / digits;
    }

    /** min(included) ~ max(not included) 실수값 반환
     ** 예) Random(0.5, 1); // 0.5 ~ 0.9999...
     */
    public static Random(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /** min(included) ~ max(included) 정수값 반환
     ** 예) RandomRange(1, 3); // 1 ~ 3
     */
    public static RandomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /** 0 ~ max(not included) 정수값 반환
     ** 예) RandomInt(10); // 0 ~ 9
     */
    public static RandomInt(num: number): number {
        return Math.floor(Math.min(Math.random() * num, num - 1));
    }

    /** 랜덤한 boolean값 반환
     ** 예) RandomBool(); // true or false
     */
    public static RandomBool(): boolean {
        return Math.floor(Math.random() * 2) === 0;
    }

    /** 주어진 배열에서 랜덤한 원소를 선택하여 반환
     ** 예) RandomSelect(["a", "b", "c"]); // "a" or "b" or "c"
     */
    public static RandomSelect<T>(array: readonly T[]): T {
        const length: number = array.length;
        if (length > 1) {
            return array[this.RandomInt(length)];
        }
        return array[0];
    }

    /** length 길이의 랜덤 문자열 반환 (length는 10이하로 권장)
     ** 대소문자 알파벳 또는 숫자가 포함됨
     ** 예) RandomString(4); // "asdf" or "QWER" or "12qA" or ...
     */
    public static RandomString(length: number): string {
        const rangeSize: number = this._randomStringRange.length;
        const generated: string[] = new Array<string>(length);
        for (let i = 0; i < length; ++i) {
            generated[i] = this._randomStringRange[this.RandomInt(rangeSize)];
        }
        return generated.join("");
    }

    /** 주어진 배열 내의 원소를 랜덤으로 섞는다.
     * 참고)
     * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
     * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     */
    public static Shuffle<T>(array: T[]) {
        for (let i = array.length - 1; i > 0; --i) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /** UTC 특정 시간대를 기준으로 날짜를 구분하기 위한 함수.
     * 기본값으로 initHour가 15로 설정된다. (한국 기준 UTC+9 00시에 날짜가 바뀜으로 UTC기준 15시를 날짜 분기점으로 잡는다.)
     */
    public static GetCurrentDay(curTime: number = Date.now(), initHour: number = Constant.DAILY_INIT_HOUR): number {
        const curDay: number = Math.floor(curTime / Constant.ONE_DAY);
        const curHour: number = Math.floor((curTime % Constant.ONE_DAY) / Constant.ONE_HOUR);
        if (curHour < initHour) {
            return curDay - 1; // 0시 ~ 날짜 분기점 시각 까지는 전날로 취급한다.
        }
        return curDay;
    }
}
