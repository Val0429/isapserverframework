// /// use case:
// /// { 42: [Val], 9: [Jere], 34: [Tina] }
// tt2.addIndex( "user.age" );
// tt2.getIndex("user.age");
// /// { 42: { Val: [Val] }, 9: { Jere: [Jere] }, 34: { Tina: [Tina] } }
// tt2.addIndex( new Set(["user.age", "user.name"]) );
// tt2.getIndex( new Set(["user.age", "user.name"]) );
// also:
// tt2.removeIndex();

import { getDeep } from "./deep";
import { Log } from "./log";

type TIndex = string | Set<string>;

const LogTitle = "IndexedArray";

export class IndexedArray<T> extends Array<T> {
    /// todo: observe the property change on Vale.Object
    /// todo: also handle constructor

    private _innateChanging: boolean = false;
    constructor(...args) {
        super(...args);
    
        let proxy = new Proxy(this, {
            // get: (target, key, receiver) => {
            //     // var len = target.length;
            //     // if (typeof name === 'string' && /^-?\d+$/.test(name))
            //     //     return target[(+name % len + len) % len];
            //     // return target[name];
            //     console.log("get!", key);
            //     return Reflect.get(target, key, receiver);
            // },
            /// indexed signature: handle other than above.
            set: (target, key, value, receiver) => {
                if (!target._innateChanging) {
                    /// only do innate job if not already innate
                }
                return Reflect.set(target, key, value, receiver);
            }
        });
        Object.defineProperty(proxy, '_innateChanging', { enumerable: false, writable: true });

        return proxy;
    }

    /// new private helper
    private makeIndexKey(index: TIndex) {
        if (typeof index === "string") return index;
        return Array.from(index).join("_*_");
    }
    private indexes: TIndex[] = [];
    private indexMap: any = {};

    private buildWithIndex(elements: T | T[], indexes?: TIndex | TIndex[]) {
        let oelements = Array.isArray(elements) ? elements : [elements];
        let oindexes = !indexes ? this.indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];

        /// pure string version
        // oindexes.forEach(index => {
        //     let idxKey = this.makeIndexKey(index);
        //     /// string
        //     let storedIndex = this.indexMap[idxKey] || (this.indexMap[idxKey] = {});

        //     oelements.forEach(element => {
        //         let value = getDeep(element, index as string);
        //         let place = storedIndex[value] || (storedIndex[value] = []);
        //         place.push(element);
        //     });
        // });

        /// string | Set<string> version
        oindexes.forEach(index => {
            let oindex = typeof index === "string" ? [index] : Array.from(index);
            let oindexLength = oindex.length - 1;

            let idxKey = this.makeIndexKey(index);
            let storedIndex = this.indexMap[idxKey] || (this.indexMap[idxKey] = {});

            oelements.forEach(element => {
                oindex.reduce((storedIndex, index, idx) => {
                    let value = getDeep(element, index);
                    if (idx === oindexLength) {
                        let place = storedIndex[value] || (storedIndex[value] = []);
                        place.push(element);
                    } else {
                        storedIndex = storedIndex[value] || (storedIndex[value] = {});
                    }
                    return storedIndex;
                }, storedIndex);
            });
        });
    }
    private destructIndex(indexes?: TIndex | TIndex[]) {
        let oindexes = !indexes ? this.indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];
        oindexes.forEach(index => {
            let idxKey = this.makeIndexKey(index);
            delete this.indexMap[idxKey];
        });
    }
    private removeWithIndex(elements?: T | T[], indexes?: TIndex | TIndex[]) {
        let oelements = Array.isArray(elements) ? elements : [elements];
        let oindexes = !indexes ? this.indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];

        // /// string version
        // oindexes.forEach(index => {
        //     let idxKey = this.makeIndexKey(index);
        //     /// string
        //     let storedIndex = this.indexMap[idxKey];
        //     if (!storedIndex) return;

        //     oelements.forEach(element => {
        //         let value = getDeep(element, index as string);
        //         let place: Array<T> = storedIndex[value];
        //         if (place == undefined) return;
        //         let idx = place.findIndex(v => v === element);
        //         if (idx < 0) {  /// element not found
        //             Log.Error(LogTitle, `Remove element not found in index! ${index} / ${element}`);
        //             return;
        //         }
        //         place.splice(idx, 1);
        //     });
        // });

        /// string | Set<string> version
        oindexes.forEach(index => {
            let oindex = typeof index === "string" ? [index] : Array.from(index);
            let oindexLength = oindex.length - 1;

            let idxKey = this.makeIndexKey(index);
            let storedIndex = this.indexMap[idxKey] || (this.indexMap[idxKey] = {});
            if (!storedIndex) return;

            oelements.forEach(element => {
                oindex.reduce((storedIndex, index, idx) => {
                    let value = getDeep(element, index);

                    if (idx === oindexLength) {
                        let place: Array<T> = storedIndex[value];
                        if (place == undefined) return;
                        let oidx = place.findIndex(v => v === element);
                        if (oidx < 0) {  /// element not found
                            Log.Error(LogTitle, `Remove element not found in index! ${index} / ${element}`);
                            return;
                        }
                        place.splice(oidx, 1);

                    } else {
                        storedIndex = storedIndex[value];
                        if (!storedIndex) Log.Error(LogTitle, `Stored Index not found in index! ${index} / ${element} / ${value}`);
                    }
                    return storedIndex;
                }, storedIndex);
            });
        });

    }

    /// new public
    /// the case to addIndex:
    /// 1) for...loop the array, call build one by one
    /// the case to add single object:
    /// 1) call build on that one
    addIndex(index: TIndex) {
        let idxKey = this.makeIndexKey(index);
        let idx = this.indexes.findIndex((value) => this.makeIndexKey(value) === idxKey);
        if (idx >= 0) return;   /// already exists

        this.indexes.push(index);
        /// build index
        this.buildWithIndex(this, index);
    }
    /// the case to removeIndex:
    /// 1) for...loop the array, call destruct one by one
    /// the case to remove single object:
    /// 1) call destruct on that one
    removeIndex(index: TIndex) {
        let idxKey = this.makeIndexKey(index);
        let idx = this.indexes.findIndex((value) => this.makeIndexKey(value) === idxKey);
        if (idx < 0) return;   /// not exists

        this.indexes.splice(idx, 1);
        /// destruct index
        this.destructIndex(index);
    }
    getIndex(index?: TIndex) {
        if (!index) return this.indexMap;
        let idxKey = this.makeIndexKey(index);
        return this.indexMap[idxKey];
    }

    /// inheritance
    static get [Symbol.species]() { return Array; }

    /// fill:   apply changes to specify element.
    fill(element: T, ...pos: number[]) {
        this._innateChanging = true;
        let rtn = super.fill(element, ...pos);
        this._innateChanging = false;
        return rtn;
    }

    /// push:   apply to all added.
    push(...elements: T[]): number {
        this._innateChanging = true;
        let rtn = super.push(...elements);
        this._innateChanging = false;
        return rtn;
    }

    /// pop:    apply to one removed.
    pop(): T {
        this._innateChanging = true;
        let rtn = super.pop();
        this.removeWithIndex(rtn);
        this._innateChanging = false;
        return rtn;
    }

    /// shift:  apply to one removed.
    shift(): T {
        this._innateChanging = true;
        let rtn = super.shift();
        this._innateChanging = false;
        return rtn;
    }

    /// unshift:apply to all added.
    unshift(...elements: T[]): number {
        this._innateChanging = true;
        let rtn = super.unshift(...elements);
        this._innateChanging = false;
        return rtn;
    }

    /// splice: apply to added / removed elements.
    splice(start: number, deleteCount?: number, ...elements: T[]): T[] {
        this._innateChanging = true;
        let rtn = super.splice(start, deleteCount, ...elements);
        this._innateChanging = false;
        return rtn;
    }
}
