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

export type TIndex = string | Set<string>;

const LogTitle = "IndexedArray";

export class IndexedArray<T> extends Array<T> {
    /// todo: observe the property change on Vale.Object

    private _innateChanging: boolean = false;
    constructor(...elements: T[]) {
        super(...elements);
        this.buildWithIndex(elements);
    
        let proxy = new Proxy(this, {
            // get: (target, key, receiver) => {
            //     return Reflect.get(target, key, receiver);
            // },
            /// indexed signature: handle other than above.
            set: (target, key, value, receiver) => {
                const regex = /^[0-9]+$/;
                if (!target._innateChanging && regex.test(key as string)) {
                    /// only do innate job if not already innate
                    this.unbuildWithIndex(target[key]);
                    this.buildWithIndex(value);
                }
                return Reflect.set(target, key, value, receiver);
            }
        });

        ['_innateChanging', '_indexes', '_indexMap'].forEach(index =>
            Object.defineProperty(proxy, index, { enumerable: false, writable: true })
            );
        return proxy;
    }

    /// new private helper
    public static makeIndexKey(index: TIndex) {
        if (typeof index === "string") return index;
        return Array.from(index).join("_*_");
    }
    private makeIndexKey(index: TIndex) {
        return IndexedArray.makeIndexKey(index);
    }
    private _indexes: TIndex[] = [];
    private _indexMap: any = {};

    private buildWithIndex(elements: T | T[], indexes?: TIndex | TIndex[]) {
        if (elements == undefined) return;
        let oelements = Array.isArray(elements) ? elements : [elements];
        let oindexes = !indexes ? this._indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];

        /// string | Set<string> version
        oindexes.forEach(index => {
            let oindex = typeof index === "string" ? [index] : Array.from(index);
            let oindexLength = oindex.length - 1;

            let idxKey = this.makeIndexKey(index);
            let storedIndex = this._indexMap[idxKey] || (this._indexMap[idxKey] = {});

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
        let oindexes = !indexes ? this._indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];
        oindexes.forEach(index => {
            let idxKey = this.makeIndexKey(index);
            delete this._indexMap[idxKey];
        });
    }
    private unbuildWithIndex(elements: T | T[], indexes?: TIndex | TIndex[]) {
        if (elements == undefined) return;
        let oelements = Array.isArray(elements) ? elements : [elements];
        let oindexes = !indexes ? this._indexes :
                Array.isArray(indexes) ? indexes :
                [indexes];

        /// string | Set<string> version
        oindexes.forEach(index => {
            let oindex = typeof index === "string" ? [index] : Array.from(index);
            let oindexLength = oindex.length - 1;

            let idxKey = this.makeIndexKey(index);
            let storedIndex = this._indexMap[idxKey] || (this._indexMap[idxKey] = {});
            if (!storedIndex) return;

            const removeByIndexes = (element: T, indexes: string[], storedIndex) => {
                let indexLength = indexes.length;
                if (indexLength === 0) return;
                let index = indexes[0];
                let value = getDeep(element, index);

                if (indexLength === 1) {
                    let place: Array<T> = storedIndex[value];
                    if (place == undefined) return;
                    let oidx = place.findIndex(v => v === element);
                    if (oidx < 0) {  /// element not found
                        Log.Error(LogTitle, `Remove element not found in index! ${index} / ${element}`);
                        return;
                    }
                    place.splice(oidx, 1);

                } else {
                    let oStoredIndex = storedIndex;
                    storedIndex = storedIndex[value];
                    if (!storedIndex) Log.Error(LogTitle, `Stored Index not found in index! ${index} / ${element} / ${value}`);
                    removeByIndexes(element, indexes.splice(1, indexes.length), storedIndex);
                    let keys = Object.keys(storedIndex);
                    keys.forEach(key => {
                        let o = storedIndex[key];
                        if (o.length === 0) delete storedIndex[key];
                    });
                    if (Object.keys(storedIndex).length === 0) delete oStoredIndex[value];
                }
            }

            oelements.forEach(element => {
                removeByIndexes(element, oindex, storedIndex);
            });
        });

    }

    /// new public
    /// the case to addIndex:
    /// 1) for...loop the array, call build one by one
    /// the case to add single object:
    /// 1) call build on that one
    addIndexes(indexes: TIndex | TIndex[]): this {
        indexes = Array.isArray(indexes) ? indexes : [indexes];

        indexes.forEach(index => {
            let idxKey = this.makeIndexKey(index);
            let idx = this._indexes.findIndex((value) => this.makeIndexKey(value) === idxKey);
            if (idx >= 0) return;   /// already exists
    
            this._indexes.push(index);
            /// build index
            this.buildWithIndex(this, index);
        });

        return this;
    }
    /// the case to removeIndex:
    /// 1) for...loop the array, call destruct one by one
    /// the case to remove single object:
    /// 1) call destruct on that one
    removeIndexes(indexes: TIndex | TIndex[]): this {
        indexes = Array.isArray(indexes) ? indexes : [indexes];

        indexes.forEach(index => {        
            let idxKey = this.makeIndexKey(index);
            let idx = this._indexes.findIndex((value) => this.makeIndexKey(value) === idxKey);
            if (idx < 0) return;   /// not exists

            this._indexes.splice(idx, 1);
            /// destruct index
            this.destructIndex(index);
        });
        
        return this;
    }
    getIndex(index?: TIndex) {
        if (!index) return this._indexMap;
        let idxKey = this.makeIndexKey(index);
        return this._indexMap[idxKey];
    }

    /// inheritance
    static get [Symbol.species]() { return Array; }

    /// fill:   no support
    fill(element: T, ...pos: number[]) {
        throw "no support for fill";
        return undefined;
    }

    /// push:   apply to all added.
    push(...elements: T[]): number {
        this._innateChanging = true;
        let rtn = super.push(...elements);
        this.buildWithIndex(elements);
        this._innateChanging = false;
        return rtn;
    }

    /// pop:    apply to one removed.
    pop(): T {
        this._innateChanging = true;
        let rtn = super.pop();
        this.unbuildWithIndex(rtn);
        this._innateChanging = false;
        return rtn;
    }

    /// shift:  apply to one removed.
    shift(): T {
        this._innateChanging = true;
        let rtn = super.shift();
        this.unbuildWithIndex(rtn);
        this._innateChanging = false;
        return rtn;
    }

    /// unshift:apply to all added.
    unshift(...elements: T[]): number {
        this._innateChanging = true;
        let rtn = super.unshift(...elements);
        this.buildWithIndex(elements);
        this._innateChanging = false;
        return rtn;
    }

    /// splice: apply to added / removed elements.
    splice(start: number, deleteCount?: number, ...elements: T[]): T[] {
        this._innateChanging = true;
        let rtn = super.splice(start, deleteCount, ...elements);
        this.unbuildWithIndex(rtn);
        this.buildWithIndex(elements);
        this._innateChanging = false;
        return rtn;
    }
}
