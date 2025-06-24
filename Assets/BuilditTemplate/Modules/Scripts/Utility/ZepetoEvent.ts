/** UnityEvent를 대체하기 위한 커스텀 구현 이벤트 핸들러
 *  - 기존 UnityEvent는 string 타입을 저장할 수 없고, number 대신 int/float, boolean 대신 bool을 써야 하는 등 사용성이 좋지 않아 별도로 구현하게 되었다.
 *  - 또한 UnityEvent에서는 멤버함수를 바로 추가할 수 없고 람다로 감싸서 추가해야만 했던 번거로움도 있었는데, 이 점도 C#의 이벤트 처리와 비슷하게 += 로 추가 가능하게 구현하였다.
 */
class ZepetoEventBase {
    private _handlers: Function[] = [];

    /** 컴파일러가 자동으로 add_handler / remove_handler 로 변환시켜주게 하는 용도.
     *  변환될때 .bind(this)가 자동으로 추가된다.
     *  - ex) value.handler += this.Foo;
     *     => value.add_handler(this.Foo.bind(this)); */
    public handler: any;

    /** 연결된 모든 핸들러를 제거 */
    public RemoveAll() {
        this._handlers.length = 0;
    }

    protected Add(handler: Function) {
        if (handler === undefined || handler === null) {
            console.warn(`ZepetoEvent.Add failed - handler is null`);
            return;
        }
        this._handlers.push(handler);
    }

    protected Remove(handler: Function) {
        if (handler === undefined || handler === null) {
            console.warn(`ZepetoEvent.Remove failed - handler is null`);
            return;
        }
        if (handler.name.length === 0) {
            // 이름이 없는 경우 람다 함수이다. 인스턴스를 비교하여 일치하지 않는 것만 남긴다.
            this._handlers = this._handlers.filter(h => h !== handler);
        } else {
            // 이름이 있는 경우 일반 함수이다. 이름을 비교하여 일치하지 않는 것만 남긴다. (바인딩된 this가 다르더라도 동일하게 취급된다.)
            this._handlers = this._handlers.filter(h => h.name !== handler.name);
        }
    }

    protected Call(...args: any[]) {
        // apply보다 call이 훨씬 빠르다고 한다. (참고: https://stackoverflow.com/questions/23769556/why-is-call-so-much-faster-than-apply)
        this._handlers.forEach(handler => handler.call(handler, ...args));
    }

    protected _Swap(other: ZepetoEventBase) {
        const temp: Function[] = this._handlers;
        this._handlers = other._handlers;
        other._handlers = temp;
    }
}

export class ZepetoEvent extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction) {
        this.Remove(handler);
    }
    public Invoke() {
        this.Call();
    }
    public Swap(other: ZepetoEvent) {
        this._Swap(other);
    }
}

export class ZepetoEvent1<T1> extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction1<T1>) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction1<T1>) {
        this.Remove(handler);
    }
    public Invoke(arg1: T1) {
        this.Call(arg1);
    }
    public Swap(other: ZepetoEvent1<T1>) {
        this._Swap(other);
    }
}

export class ZepetoEvent2<T1, T2> extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction2<T1, T2>) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction2<T1, T2>) {
        this.Remove(handler);
    }
    public Invoke(arg1: T1, arg2: T2) {
        this.Call(arg1, arg2);
    }
    public Swap(other: ZepetoEvent2<T1, T2>) {
        this._Swap(other);
    }
}

export class ZepetoEvent3<T1, T2, T3> extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction3<T1, T2, T3>) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction3<T1, T2, T3>) {
        this.Remove(handler);
    }
    public Invoke(arg1: T1, arg2: T2, arg3: T3) {
        this.Call(arg1, arg2, arg3);
    }
    public Swap(other: ZepetoEvent3<T1, T2, T3>) {
        this._Swap(other);
    }
}

export class ZepetoEvent4<T1, T2, T3, T4> extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction4<T1, T2, T3, T4>) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction4<T1, T2, T3, T4>) {
        this.Remove(handler);
    }
    public Invoke(arg1: T1, arg2: T2, arg3: T3, arg4: T4) {
        this.Call(arg1, arg2, arg3, arg4);
    }
    public Swap(other: ZepetoEvent4<T1, T2, T3, T4>) {
        this._Swap(other);
    }
}

export class ZepetoEvent5<T1, T2, T3, T4, T5> extends ZepetoEventBase {
    public add_handler(handler: ZepetoAction5<T1, T2, T3, T4, T5>) {
        this.Add(handler);
    }
    public remove_handler(handler: ZepetoAction5<T1, T2, T3, T4, T5>) {
        this.Remove(handler);
    }
    public Invoke(arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) {
        this.Call(arg1, arg2, arg3, arg4, arg5);
    }
    public Swap(other: ZepetoEvent5<T1, T2, T3, T4, T5>) {
        this._Swap(other);
    }
}

export type ZepetoAction = () => void;
export type ZepetoAction1<T1> = (arg1: T1) => void;
export type ZepetoAction2<T1, T2> = (arg1: T1, arg2: T2) => void;
export type ZepetoAction3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;
export type ZepetoAction4<T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => void;
export type ZepetoAction5<T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => void;
