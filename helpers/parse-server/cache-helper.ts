import { BehaviorSubject } from "rxjs";
import { ParseObject } from "./parse-helper";
import { jsMapAssign } from "helpers/utility/jsmap-assign";

type GetInterface<T> = T extends ParseObject<infer U> ? U : never;
type ParseObjectClass = { new(...args): ParseObject<any> };
export class CacheQuery<T extends ParseObjectClass, U = T extends { new(...args): infer A } ? A : never> {
    private cached: BehaviorSubject<U[]>;
    private cacheIndexById: { [index: string]: U };
    private filterFunc: ((U) => boolean)[] = [];
    private sortFunc: (a: U, b: U) => number;

    constructor(classObj: T, sj: BehaviorSubject<U[]>) {
        this.cached = sj;
        (async () => {
            let result = await this.cached.filter(v => v ? true : false).first().toPromise();
            this.cacheIndexById = result.reduce( (final, data) => {
                final[(data as any).id] = data;
                return final;
            }, {});
        })();
    }

    private makeFilterFunc(key: string, value, compare: (source, target) => boolean): (data: U) => boolean {
        let keys = key.split(".");
        return (data: U): boolean => {
            let attr = (data as any).attributes;
            for (let ikey of keys) {
                attr = attr[ikey];
                if (!attr) return false;
            }
            return compare(attr, value);
        }
    }

    private async performFind(): Promise<U[]> {
        let result = await this.cached.filter(v => v ? true : false).first().toPromise();
        return result.reduce( (final, data) => {
            /// perform filter
            for (let func of this.filterFunc) {
                if (func(data) === false) return final;
            }
            final.push(data);
            return final;
        }, []);
    }

    equalTo(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a instanceof ParseObject ? a.id === b.id : a === b) );
        return this;
    }

    notEqualTo(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a instanceof ParseObject ? a.id !== b.id : a !== b) );
        return this;
    }

    greaterThan(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a > b) );
        return this;
    }

    greaterThanOrEqualTo(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a >= b) );
        return this;
    }

    lessThan(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a < b) );
        return this;
    }

    lessThanOrEqualTo(key: string, value: any) {
        this.filterFunc.push( this.makeFilterFunc(key, value, (a, b) => a <= b) );
        return this;
    }

    ascending(key: string) {
        this.sortFunc = (a, b) => { if (a<b) return -1; if (b<a) return 1; return 0; }
        return this;
    }
    descending(key: string) {
        this.sortFunc = (a, b) => { if (a>b) return -1; if (b>a) return 1; return 0; }
        return this;
    }

    async count(): Promise<number> {
        let result = await this.performFind();
        return result.length;
    }

    async find(): Promise<U[]> {
        let result = await this.performFind();
        return result;
    }

    async get(id: string): Promise<U> {
        await this.cached.filter(v => v ? true : false).first().toPromise();
        return this.cacheIndexById[id];

        // this.filterFunc.push( (a) => a.id === id );
        // let result = await this.performFind();
        // return result.length === 0 ? null : result[0];
    }

    async first(): Promise<U> {
        let result = await this.performFind();
        return result.length === 0 ? null : result[0];
    }
}

export class CacheParse {
    private caching: Map<string, BehaviorSubject<ParseObject<any>[]>> = new Map();

    Query<T extends ParseObjectClass>(classObj: T): CacheQuery<T> {
        let first = false;
        let sj = jsMapAssign(this.caching, classObj.name, () => { first = true; return new BehaviorSubject(undefined) });
        if (first) {
            (async () => sj.next(await new Parse.Query(classObj).find()))();
            // (async () => {
            //     let result = await new Parse.Query(classObj).find();
            //     sj.next(result);
            // })();
        }
        return new CacheQuery(classObj, sj as any);
    }

    dispose() {
        this.caching.clear();
    }
}
