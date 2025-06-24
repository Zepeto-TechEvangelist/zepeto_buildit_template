/** 우선순위 큐에 넣을 수 있는 원소 인터페이스 */
export interface INode<T> {
    priority: number;
    id: T;
}
/** 우선순위 큐에 적용할 정렬 방법 (커스텀 비교 로직 사용 가능) */
export type CompFunc = <T, Node extends INode<T>>(lhs: Node, rhs: Node) => boolean;
/** 오름차순 정렬 (min, ..., max) */
export const Greater = <T, Node extends INode<T>>(lhs: Node, rhs: Node): boolean => lhs.priority > rhs.priority;
/** 내림차순 정렬 (max, ..., min) */
export const Less = <T, Node extends INode<T>>(lhs: Node, rhs: Node): boolean => lhs.priority < rhs.priority;

/** C++ STL의 priority_queue 와 동일하게 구현된 HeapSort 기반 우선순위 큐 */
export default class PriorityQueue<T, Node extends INode<T>> {
    private readonly _heap = new Array<Node>();
    private readonly _comp: CompFunc;

    constructor(comp = Less) {
        this._comp = comp;
    }

    /** 우선순위 큐가 비어있는지 확인한다.
     ** 시간복잡도: ```O(1)``` */
    public IsEmpty(): boolean {
        return this._heap.length === 0;
    }

    /** 우선순위 큐에 쌓인 원소 갯수를 반환한다.
     ** 시간복잡도: ```O(1)``` */
    public Size(): number {
        return this._heap.length;
    }

    /** 가장 우선순위가 높은 원소를 반환한다. (큐에서 제거 x)
     ** 시간복잡도: ```O(1)``` */
    public Top(): Node {
        return this._heap[0];
    }

    /** 우선순위 큐에 새 원소를 추가한다.
     ** 원소가 0개 -> 1개가 되는 경우 시간복잡도: ```O(1)```
     ** 이외의 시간복잡도: ```O(log n)``` */
    public Push(node: Node) {
        this._heap.push(node);
        this.PushHeap();
    }

    /** 가장 우선순위가 높은 원소를 꺼내서 반환한다. (큐에서 제거)
     ** 원소가 2개 이상인 경우 시간복잡도: ```O(log n)```
     ** 원소가 0 ~ 1개인 경우 시간복잡도: ```O(1)```
     ** 원소가 0개인 경우 ```undefined```를 반환한다. */
    public Pop(): Node {
        this.PopHeap();
        return this._heap.pop();
    }

    /** 선형탐색으로 id가 일치하는 원소를 찾아서(```O(n)```) 제거한 뒤 전체 범위에 대해 heapify(```O(n log n)```) 수행한다.
     ** 시간복잡도: ```O(n log n)```
     ** 즉, 매우 느리므로 대신 ```Find()```함수를 통해 제외할 원소를 비활성화 하는 식으로 처리하길 권장 (Scheduler.ts 참고)*/
    public Remove(id: T): boolean {
        const index: number = this.FindIndex(id);
        if (index > -1) {
            if (index === 0) {
                // 맨 앞의 원소 제거시에는 그냥 pop 하면 된다.
                this.Pop();
            } else {
                // 다른 원소 제거시에는 제거 후 힙을 재구성해야 한다.
                this._heap.splice(index, 1);
                this.MakeHeap();
            }
            return true;
        }
        return false;
    }

    /** 선형탐색으로 id가 일치하는 원소를 반환한다.
     ** 시간복잡도: ```O(n)``` */
    public Find(id: T): Node {
        const index: number = this.FindIndex(id);
        if (index > -1) {
            return this._heap[index];
        }
        return null;
    }

    /** 내부 컨테이너를 그대로 반환한다.
     ** 컨테이너 순회 로직이 필요할 때 사용한다. */
    public GetContent(): Node[] {
        return this._heap;
    }

    /** 선형탐색으로 id가 일치하는 원소의 인덱스를 반환한다. */
    private FindIndex(id: T): number {
        const length: number = this._heap.length;
        for (let index = 0; index < length; ++index) {
            if (this._heap[index].id === id) {
                return index;
            }
        }
        return -1;
    }

    /** C++ STL의 push_heap() 함수 참고하여 구현 */
    private PushHeap() {
        let length: number = this.Size();
        if (length > 1) {
            const bottomValue: Node = this._heap[--length];
            this.PushHeapByIndex(length, 0, bottomValue);
        }
    }

    /** C++ STL의 pop_heap() 함수 참고하여 구현 */
    private PopHeap() {
        let length: number = this.Size();
        if (length > 1) {
            const bottomValue: Node = this._heap[--length];
            this._heap[length] = this._heap[0];
            this.PopHeapByIndex(0, length, bottomValue);
        }
    }

    /** C++ STL의 _Push_heap_by_index() 함수 참고하여 구현 */
    private PushHeapByIndex(hole: number, top: number, bottomValue: Node) {
        for (let index = (hole - 1) >> 1; top < hole && this._comp(this._heap[index], bottomValue); index = (hole - 1) >> 1) {
            this._heap[hole] = this._heap[index];
            hole = index;
        }
        this._heap[hole] = bottomValue;
    }

    /** C++ STL의 _Pop_heap_hole_by_index() 함수 참고하여 구현 */
    private PopHeapByIndex(hole: number, bottom: number, bottomValue: Node) {
        const max: number = (bottom - 1) >> 1;
        const top: number = hole;
        let index: number = top;
        while (index < max) {
            index = (index << 1) + 2;
            if (this._comp(this._heap[index], this._heap[index - 1])) {
                --index;
            }
            this._heap[hole] = this._heap[index];
            hole = index;
        }
        if (index === max && bottom % 2 === 0) {
            this._heap[hole] = this._heap[bottom - 1];
            hole = bottom - 1;
        }
        this.PushHeapByIndex(hole, top, bottomValue);
    }

    /** C++ STL의 _Make_heap_uncheked() 함수 참고하여 구현 */
    private MakeHeap() {
        const bottom: number = this.Size();
        for (let hole = bottom >> 1; hole > 0; ) {
            const value = this._heap[--hole];
            this.PopHeapByIndex(hole, bottom, value);
        }
    }
}
