/** ID풀 인터페이스 */
export default interface IIdPool {
    NextId(): number;
}

/** 주어진 범위 내에서 돌고도는 기본적인 ID풀 */
export class SimpleIdPool implements IIdPool {
    private readonly _startId: number;
    private readonly _maxId: number;

    private _curId: number;

    constructor(startId: number = 0, maxId: number = Number.MAX_SAFE_INTEGER) {
        this._startId = startId;
        this._maxId = maxId;
        this._curId = startId - 1;
    }

    public NextId(): number {
        if (this._maxId < ++this._curId) {
            this._curId = this._startId;
        }
        return this._curId;
    }
}

/** 할당한 id를 반환받으면 다시 재사용 가능한 ID풀 */
export class RecycleIdPool extends SimpleIdPool {
    private readonly _usingIds = new Set<number>();
    private readonly _useableIds = new Array<number>();

    public override NextId(): number {
        const id: number = this._useableIds.length > 0 ? this._useableIds.pop() : super.NextId();
        this._usingIds.add(id);
        return id;
    }

    public ReleaseId(id: number) {
        // 사용처에서 실수로 중복 반환하는 경우에 대비한 유효성 검사
        if (this._usingIds.delete(id)) {
            this._useableIds.push(id);
        }
    }

    public IsUsingId(id: number) {
        return this._usingIds.has(id);
    }
}
