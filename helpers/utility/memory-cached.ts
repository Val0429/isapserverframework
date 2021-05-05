import { serverReady } from "core/pending-tasks";
import { ParseObject } from "helpers/parse-server/parse-helper-core";
import { Meta } from "./meta";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

/// Reference
// type Constructor<T> = { new(...args): T };
// @registerSubclass() export class Cameras extends ParseObject<ICameras> {
//     static itemList: { [objectId: string]: any } = {};
//     static async init() {
//         let items = await new Parse.Query<any>(this.name).find();
//         for (let item of items) {
//             let objectId = item.id;
//             /// ignore existing id
//             if (this.itemList[objectId]) continue;
//             this.updateMapping(item);
//         }
//     }
//     static updateMapping<T>(this: Constructor<T>, item: T) {
//         let me: any = this;
//         let o: any = item;
//         let id = o.id;
//         me.itemList[id] = item;
//     }

//     static deleteMapping<T>(this: Constructor<T>, item: T | string) {
//         let me: any = this;
//         let o: any = item;
//         let id = typeof o === "string" ? o : o.id;
//         delete me.itemList[id];
//     }

//     save(...args) {
//         let rtn = super.save(...args);
//         Cameras.updateMapping(this);
//         return rtn;
//     }
//     destroy(...args) {
//         let rtn = super.destroy(...args);
//         Cameras.deleteMapping(this);
//         return rtn;
//     }
// }

type Constructor<T> = { new(...args): T };
type ConstructorT<T> = T extends { new(...args): infer U } ? U : never;
type ExtractParseObjectT<T> = T extends ParseObject<infer U> ? U : never;
declare module "helpers/parse-server/parse-helper-core" {
    namespace ParseObject {
        export function getCachedList<T>(targetClass: Constructor<T>): Promise<{ [objectId: string]: T }>;
        export function getCachedOBInited<T>(targetClass: Constructor<T>): Observable<undefined | { [objectId: string]: T }>;
        export function getCachedOBAdded<T>(targetClass: Constructor<T>): Observable<T>;
        export function getCachedOBUpdated<T>(targetClass: Constructor<T>): Observable<T>;
        export function getCachedOBDeleted<T>(targetClass: Constructor<T>): Observable<T>;

        export function getCachedByIndex<T>(targetClass: Constructor<T>, key: keyof ExtractParseObjectT<T>): { [instanceKey: string]: T[] };
        export function getCachedByIndex<T>(targetClass: Constructor<T>, key: keyof ExtractParseObjectT<T>, instanceKey: string): T[];
        export function getCachedOneByIndex<T>(targetClass: Constructor<T>, key: keyof ExtractParseObjectT<T>, instanceKey: string): T;

        export function getCachedById<T>(targetClass: Constructor<T>, id: string): T;
    }
}

/// add below interface to metaObject:
// interface IMemoryCachedMeta {
//     cachedList: { [objectId: string]: any };
//     cachedIndexList: { [indexName: string]: { [instanceKey: string]: any[] } };
//     waitForInited: () => Promise< undefined | { [objectId: string]: any } >;
//     sjInited: BehaviorSubject< undefined | { [objectId: string]: any } >;
//     sjAdded: Subject<any>;
//     sjUpdated: Subject<any>;
//     sjDeleted: Subject<any>;
// }
interface IMemoryCachedConfig {
    indexes?: string[];
}
// config?: IMemoryCachedConfig<T>
export function memoryCached<T>(config?: IMemoryCachedConfig) {
    return (targetClass) => {
        /// main Metas
        let target: any = targetClass;
        let name = target.name;
        let indexes = (config||{}).indexes;
        let cachedList: { [objectId: string]: any } = {};
        let cachedIndexList: { [indexName: string]: { [instanceKey: string]: any[] } } = {};
        let sjInited: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
        let sjAdded: Subject<any> = new Subject<any>();
        let sjUpdated: Subject<any> = new Subject<any>();
        let sjDeleted: Subject<any> = new Subject<any>();
        let waitForInited = () => sjInited.filter(v => !!v).first().toPromise();
        let metaObject = Meta.get(target);
        metaObject.cachedList = cachedList;
        metaObject.cachedIndexList = cachedIndexList;
        metaObject.waitForInited = waitForInited;
        metaObject.sjInited = sjInited;
        metaObject.sjAdded = sjAdded;
        metaObject.sjUpdated = sjUpdated;
        metaObject.sjDeleted = sjDeleted;

        /// update indexing
        let getCachedIndexName = (indexName: string, ref?: any): { [instanceKey: string]: any[] } => {
            ref = ref || cachedIndexList;
            return ref[indexName] || (ref[indexName] = {});
        }
        let getCachedInstanceKey = (indexName: string, instanceKey: string, ref?: any): any[] => {
            ref = ref || cachedIndexList;
            let index1 = getCachedIndexName(indexName, ref);
            return index1[instanceKey] || (index1[instanceKey] = []);
        }
        let addIndexing = (item, ref?, customIndexes?) => {
            customIndexes = customIndexes || indexes;
            if (!customIndexes || !item) return;
            for (let indexName of customIndexes) {
                getCachedInstanceKey(indexName, item.getValue(indexName), ref).push(item);
            }
        }
        let deleteIndexing = (item, ref?) => {
            if (!indexes || !item) return;
            let id = item.id;
            for (let indexName of indexes) {
                let arylist = getCachedInstanceKey(indexName, item.getValue(indexName), ref);
                let idx = arylist.findIndex(v => v.id === id);
                arylist.splice(idx, 1);
            }
        }
        let ensureIndexing = (metaObject, key) => {
            let cachedIndexList = metaObject.cachedIndexList;
            if (!cachedIndexList) return;
            let cachedList = metaObject.cachedList;
            if (!cachedIndexList[key]) {
                /// remake
                let customIndexes = [key];
                Object.keys(cachedList).forEach(v => addIndexing(cachedList[v], cachedIndexList, customIndexes));
                indexes.push(key);
            }
        }

        /// update mapping
        let updateMapping = (item, isInit: boolean = false) => {
            let id = item.id;
            let cached = cachedList[id];
            deleteIndexing(cached);
            cachedList[id] = item;
            addIndexing(item);
            if (isInit) return;
            if (cached) sjUpdated.next(item);
            else sjAdded.next(item);
        }
        let deleteMapping = (item) => {
            let id = typeof item === "string" ? item : item.id;
            let cached = cachedList[id];
            delete cachedList[id];
            deleteIndexing(cached);
            sjDeleted.next(item);
        }
        let init = async () => {
            let items = await new Parse.Query<any>(name).findAll();
            items.forEach(v => updateMapping(v, true));
            sjInited.next(cachedList);
        }

        /// replace save
        let protoSave = target.prototype.save;
        target.prototype.save = async function(...args) {
            await waitForInited();
            let rtn = await protoSave.call(this, ...args);
            updateMapping(this);
            return rtn;
        }
        /// replace destroy
        let protoDestroy = target.prototype.destroy;
        target.prototype.destroy = async function(...args) {
            await waitForInited();
            let rtn = await protoDestroy.call(this, ...args);
            deleteMapping(this);
            return rtn;
        }

        /// add getCachedOBInited to ParseObject
        if (!ParseObject.getCachedOBInited) {
            ParseObject.getCachedOBInited = function(target) {
                let metaObject = Meta.get(target);
                if (!metaObject.cachedList) return;
                return metaObject.sjInited.asObservable();
            }
        }

        /// add getCachedList to ParseObject
        if (!ParseObject.getCachedList) {
            ParseObject.getCachedList = async function(target) {
                let metaObject = Meta.get(target);
                let cachedList = metaObject.cachedList;
                if (!cachedList) return;
                await metaObject.waitForInited();
                return cachedList;
            };
        }
        /// add getCachedOBAdded to ParseObject
        if (!ParseObject.getCachedOBAdded) {
            ParseObject.getCachedOBAdded = function(target) {
                let metaObject = Meta.get(target);
                if (!metaObject.cachedList) return;
                return metaObject.sjAdded.asObservable();
            }
        }
        /// add getCachedOBUpdated to ParseObject
        if (!ParseObject.getCachedOBUpdated) {
            ParseObject.getCachedOBUpdated = function(target) {
                let metaObject = Meta.get(target);
                if (!metaObject.cachedList) return;
                return metaObject.sjUpdated.asObservable();
            }
        }
        /// add getCachedOBUpdated to ParseObject
        if (!ParseObject.getCachedOBDeleted) {
            ParseObject.getCachedOBDeleted = function(target) {
                let metaObject = Meta.get(target);
                if (!metaObject.cachedList) return;
                return metaObject.sjDeleted.asObservable();
            }
        }
        /// add getCachedByIndex to ParseObject
        if (!ParseObject.getCachedByIndex) {
            ParseObject.getCachedByIndex = function(target, key, instanceKey?) {
                let metaObject = Meta.get(target);
                let cachedIndexList = metaObject.cachedIndexList;
                if (!cachedIndexList) return;
                ensureIndexing(metaObject, key);
                if (!instanceKey) return getCachedIndexName(key, cachedIndexList) as any;
                return getCachedInstanceKey(key, instanceKey, cachedIndexList) as any;
            }
        }
        /// add getCachedOneByIndex to ParseObject
        if (!ParseObject.getCachedOneByIndex) {
            ParseObject.getCachedOneByIndex = function(target, key, instanceKey) {
                let metaObject = Meta.get(target);
                let cachedIndexList = metaObject.cachedIndexList;
                if (!cachedIndexList) return;
                ensureIndexing(metaObject, key);
                let ary = getCachedInstanceKey(key as any, instanceKey, cachedIndexList);
                return ary.length === 0 ? undefined : ary[0];
            }
        }

        /// add getCachedById to ParseObject
        if (!ParseObject.getCachedById) {
            ParseObject.getCachedById = function(target, id) {
                let metaObject = Meta.get(target);
                let cachedList = metaObject.cachedList;
                if (!cachedList) return;
                return cachedList[id];
            }
        }

        /// register init
        (async () => {
            await serverReady;
            await init();
        })();
        
        /// return new class
        return targetClass;
    }
}