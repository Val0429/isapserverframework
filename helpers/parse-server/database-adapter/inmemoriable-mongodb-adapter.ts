import { MongoStorageAdapter } from 'parse-server/lib/Adapters/Storage/Mongo/MongoStorageAdapter';
import { retrievePrimaryClassMeta, ParseObject } from '../parse-helper';
import { Log } from 'helpers/utility';

const LogTitle: string = "InmemoriableMongoDB";

type SchemaType = any;
type QueryType = any;

export type QueryOptions = {
  skip?: number,    /// skip how many records
  limit?: number,   /// limit
  acl?: string[],
  sort?: { [index: string]: number },   /// -1 for desc, 1 for asc
  count?: boolean | number,
  keys?: string[],  /// if with keys array, only take those fields
  op?: string,
  distinct?: boolean,
  pipeline?: any,
  readPreference?: string,
};

export class InMemoriableMongoDBAdapter extends MongoStorageAdapter {
    constructor(config) {
        super(config);
    }

    async createObject(
        className: string,
        schema: SchemaType,
        object: any
    ): Promise<any> {
        return new Promise( async (resolve, reject) => {
            try {
                /// handle memory cache
                let meta = retrievePrimaryClassMeta(className);
                let { memoryCache } = meta || {} as any;
                if (memoryCache) await this.makeCache(className);

                /// delegate old createObject
                super.createObject(className, schema, object)
                    .then( (result) => {
                        if (memoryCache) {
                            /// update memory cache
                            result.ops.forEach( (data) => {
                                let { _id: objectId, _created_at: createdAt, _updated_at: updatedAt, ...rest } = data;
                                /// resolve rest pointers
                                let resolvePointers = (data) => {
                                    let isArray = Array.isArray(data);
                                    /// bypass array of pointers for now.
                                    if (isArray) return data;
                                    if (data instanceof Date) return { __type: 'Date', iso: data.toISOString() }
                                    return Object.keys(data).reduce( (final, key) => {
                                        let value = data[key];
                                        if (typeof value === 'object') final[key] = resolvePointers(value);
                                        else if (key[0] === "_" && key.indexOf("_p_") === 0) {
                                            key = key.substr(3, key.length);
                                            let [ className, objectId ] = value.split("$");
                                            final[key] = { __type: "Pointer", className, objectId };
                                        } else final[key] = value;
                                        return final;
                                    }, {});
                                }
                                rest = resolvePointers(rest);
                                let final = {objectId, ...rest, createdAt, updatedAt};
                                this.pushCache(className, final);
                            });
                        }
                        resolve(result);
                    }).catch( (e) => reject(e));
            } catch(e) { reject(e) }
        });
    }

    async find(
        className: string,
        schema: SchemaType,
        query: QueryType,
        options: QueryOptions
    ): Promise<any[]> {
        return new Promise<any[]>( async (resolve, reject) => {
            try {
                /// handle memory cache
                let meta = retrievePrimaryClassMeta(className);
                let { memoryCache } = meta || {} as any;
                if (memoryCache) {
                    await this.makeCache(className);
                    let trace = Log.TraceTime(LogTitle, `cache time ${className}`);
                    let result = this.findInMemoryCache(className, schema, query, options);
                    trace.end();
                    return resolve(result);
                }
                let trace = Log.TraceTime(LogTitle, `query time ${className}`);
                super.find(className, schema, query, options)
                    .then( (result) => {
                        trace.end();
                        resolve(result);
                    }).catch( (e) => reject(e));

            } catch(e) { reject(e) }
        });
    }

    async findOneAndUpdate(className: string, schema: SchemaType, query: QueryType, update) {
        return new Promise( async (resolve, reject) => {
            try {
                /// handle memory cache
                let meta = retrievePrimaryClassMeta(className);
                let { memoryCache } = meta || {} as any;
                if (memoryCache) await this.makeCache(className);

                super.findOneAndUpdate(className, schema, query, update)
                    .then( (result) => {
                        if (memoryCache) {
                            this.updateCache(className, result);
                        }
                        resolve(result);
                    }).catch( (e) => reject(e));
            } catch(e) { reject(e) }
        });
    }

    async updateObjectsByQuery(className: string, schema: SchemaType, query: QueryType, update) {
        return new Promise( async (resolve, reject) => {
            try {
                /// handle memory cache
                let meta = retrievePrimaryClassMeta(className);
                let { memoryCache } = meta || {} as any;
                if (memoryCache) await this.makeCache(className);

                super.updateObjectsByQuery(className, schema, query, update)
                    .then( (result) => {
                        if (memoryCache) {
                            this.updateCache(className, result);
                        }
                        resolve(result);
                    }).catch( (e) => reject(e));

            } catch(e) { reject(e) }
        });
    }

    async deleteObjectsByQuery(className: string, schema: SchemaType, query: QueryType) {
        return new Promise( async (resolve, reject) => {
            try {
                /// handle memory cache
                let meta = retrievePrimaryClassMeta(className);
                let { memoryCache } = meta || {} as any;
                if (memoryCache) await this.makeCache(className);

                super.deleteObjectsByQuery(className, schema, query)
                    .then( (result) => {
                        /// remove by objectId
                        if (memoryCache) {
                            this.deleteCache(className, query.objectId);
                        }
                        resolve(result);
                    }).catch( (e) => reject(e));

            } catch(e) { reject(e) }
        });
    }

    /// cache helpers ///////////////////////////////////////
    private cacheMap: Map<string, any[]> = new Map();
    private async makeCache(className: string) {
        let cache = this.cacheMap.get(className);
        if (cache) return null;
        return new Promise( async (resolve, reject) => {
            let schema;
            try {
                schema = await super.getClass(className);
            } catch(e) {
                let result = [];
                this.cacheMap.set(className, result);
                return resolve(result);
            }
            super.find(className,
                schema,
                // { className, fields: {}, classLevelPermissions: {}, indexes: { _id_: { _id: 1 } } },
                { _rperm: { '$in': [ null, '*' ] } },
                { skip: undefined, limit: undefined, sort: {}, keys: undefined, readPreference: undefined }
            ).then( (result) => {
                result = result || [];
                this.cacheMap.set(className, result);
                resolve(result);
            });
        });
    }
    private deleteCache(className: string, objectId: string) {
        let cache = this.cacheMap.get(className);
        if (!cache) return;
        if (!objectId) cache.splice(0, cache.length);
        let idx = cache.findIndex( (data) => data.objectId === objectId );
        if (idx >= 0) cache.splice(idx, 1);
    }
    private updateCache(className: string, data: any[] | any) {
        if (!data) return;
        if (!Array.isArray(data)) data = [data];
        let cache = this.cacheMap.get(className);
        if (!cache) return;
        data.forEach( (unit) => {
            let idx = cache.findIndex( (value) => unit.objectId === value.objectId );
            if (idx >= 0) cache.splice(idx, 1, unit);
        });
    }
    private pushCache(className: string, data: any) {
        if (!data) return;
        let cache = this.cacheMap.get(className);
        if (!cache) return;
        cache.push(data);
    }

    /**
     * for equalTo
     * e.g. { 'data.name': 'Songshan', _rperm: { '$in': [ null, '*' ] } }
     * for notEqualTo
     * e.g. { 'data.name': { '$ne': 'Songshan' } }
     * for lessThan
     * e.g. { lft: { '$lt': 5 } }
     * for lessThanOrEqualTo
     * e.g. { lft: { '$lte': 5 } }
     * for greaterThan
     * e.g. { lft: { '$gt': 5 } }
     * for greaterThanOrEqualTo
     * e.g. { lft: { '$gte': 5 } }
     * for containedIn
     * e.g. { 'data.name': { '$in': [ 'SongShan' ] } }
     * for notContainedIn
     * e.g. { 'data.name': { '$nin': [ 'SongShan' ] } }
     * for exists or doesNotExists
     * e.g. { 'data.name': { '$exists': true } }
     */
    private findInMemoryCache(className: string, schema: SchemaType, query: QueryType, options: QueryOptions): any[] {
        /// 1) get data
        let data = this.cacheMap.get(className);
        /// 2) handle query
        let filters = [];
        Object.keys(query).forEach( (key) => {
            if (key === '_rperm') return;
            let value = query[key];
            filters.push( this.makeQuery(key, value) );
        });
        /// 2.1) execute filters
        data = data.filter( (value) => {
            for (let filter of filters) {
                if (filter(value) === false) return false;
            }
            return true;
        });
        /// 3) handle options
        let { keys, sort, skip, limit } = options;
        // keys?: string[],  /// if with keys array, only take those fields
        if (keys && keys.length > 0) {
            data = this.pickObject(data, keys);
        }
        // sort?: { [index: string]: number },   /// -1 for desc, 1 for asc
        if (sort) {
            /// there are no multiple sort, only single sort
            let skeys = Object.keys(sort);
            if (skeys.length > 0) {
                let key = skeys[0];
                let value = sort[key];
                data = data.sort( (a, b) => {
                    let va = a[key], vb = b[key];
                    return va < vb ? -value : va === vb ? 0 : value
                });
            }
        }

        // skip?: number,    /// skip how many records
        // limit?: number,   /// limit
        if (skip || limit) {
            skip = skip || 0;
            limit = limit || 100;
            data = data.slice(skip, skip+limit);
        }
        return data;
    }    

    /// pick object with key rule
    private pickObject(data: any[], keys: string[]) {
        return data.map( (unit) => keys.reduce( (final, key) => { final[key] = unit[key]; return final; }, {}) );
    }    

    /// find precise value by dot anotation key
    private findFieldValue(data: any, key: string) {
        /// get real data
        let seperates = key.split(".");
        let length = seperates.length;
        for (let i=1; i<=length; ++i) {
            if (!data) break;
            data = data[seperates[i-1]];
        }
        return data;
    }

    /// do query search
    private makeQuery(key: string, value: any): (data) => boolean {
        return (data) => {
            main: do {
                /// get real data
                data = this.findFieldValue(data, key);
                if (!data) break main;
                
                /// compare data with rules
                if (typeof value === 'string') {
                    /// 1) for equalTo
                    if (data === value) return true;
                } else {
                    /// object types,
                    let keys = value["__type"] ? ["__type"] : Object.keys(value);
                    for (let i=0; i<keys.length; ++i) {
                        let key = keys[i];
                        let val = value[key];
                        switch (key) {
                            case '$ne':
                                // 1) for notEqualTo
                                // e.g. { 'data.name': { '$ne': 'Songshan' } }
                                if ( !(data !== val) ) break main;
                                break;

                            case '$lt':
                                // 2) for lessThan
                                // e.g. { lft: { '$lt': 5 } }
                                if ( !(data < val) ) break main;
                                break;

                            case '$lte':
                                // 3) for lessThanOrEqualTo
                                // e.g. { lft: { '$lte': 5 } }
                                if ( !(data <= val) ) break main;
                                break;

                            case '$gt':
                                // 4) for greaterThan
                                // e.g. { lft: { '$gt': 5 } }
                                if ( !(data > val) ) break main;
                                break;

                            case '$gte':
                                // * for greaterThanOrEqualTo
                                // * e.g. { lft: { '$gte': 5 } }
                                if ( !(data >= val) ) break main;
                                break;

                            case '$in':
                                // * for containedIn
                                // * e.g. { 'data.name': { '$in': [ 'SongShan' ] } }
                                if ( !(val.indexOf(data)>=0) ) break main;
                                break;

                            case '$nin':
                                // * for notContainedIn
                                // * e.g. { 'data.name': { '$nin': [ 'SongShan' ] } }
                                if ( !(val.indexOf(data)<0) ) break main;
                                break;

                            case '$exists':
                                // * for exists or doesNotExists
                                // * e.g. { 'data.name': { '$exists': true } }
                                if ( !(!val === (data === undefined || data === null)) ) break main;
                                break;

                            case '__type':
                                if ( !(value.objectId === data.objectId) ) break main;
                                break;

                            default:
                                throw `<InMemoriableMongoDBAdapter> operator ${key} not implemented.`;
                        }
                    }
                    return true;
                }

            } while(0);
            
            return false;
        }
    }
    /////////////////////////////////////////////////////////    
}