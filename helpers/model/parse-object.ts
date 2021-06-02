import { ParseObject } from 'helpers/parse-server/parse-helper';
import { Tree } from 'models/nodes';
import { IKeyValueObject, IKeyValueParseObject } from './';
import * as Rx from 'rxjs';

type INotice =
    | {
          crud: 'c' | 'd';
          data: Parse.Object;
      }
    | {
          crud: 'u';
          data: Parse.Object;
          prev: Parse.Object;
      };

export class ParseObjectNotice<T = {}> extends ParseObject<T> {
    protected static _notice$: Rx.Subject<INotice> = new Rx.Subject();

    /**
     * Destroy
     */
    async destroy(options?: Parse.Object.DestroyOptions): Promise<this> {
        try {
            let result = await super.destroy(options);

            ParseObjectNotice._notice$.next({
                crud: 'd',
                data: this,
            });

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Destroy Without Notify
     */
    async destroy1(options?: Parse.Object.DestroyOptions): Promise<this> {
        try {
            let result = await super.destroy(options);

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save
     */
    async save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(key: string, value: any, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(attrs: object, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(arg1?, arg2?, arg3?): Promise<this> {
        try {
            let crud: 'c' | 'r' | 'u' | 'd' = !!this.id ? 'u' : 'c';
            let prev = crud === 'c' ? undefined : await new Parse.Query(this.className).equalTo('objectId', this.id).first();

            let result = await super.save(...arguments);

            if (crud === 'c') {
                ParseObjectNotice._notice$.next({
                    crud: 'c',
                    data: this,
                });
            } else {
                ParseObjectNotice._notice$.next({
                    crud: 'u',
                    data: this,
                    prev: prev,
                });
            }

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save Without Notify
     * @param attrs
     * @param options
     */
    async save1(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(key: string, value: any, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(attrs: object, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(arg1?, arg2?, arg3?): Promise<this> {
        try {
            let result = await super.save(...arguments);

            return result;
        } catch (e) {
            throw e;
        }
    }

    public static async Validate(attr: any, ...args: any[]): Promise<any> {}
}

export abstract class TreeNotice<T = {}> extends Tree<T> {
    abstract groupBy: keyof T | null;

    protected static _notice$: Rx.Subject<INotice> = new Rx.Subject();

    /**
     * Destory
     */
    async destroy(options?: Parse.Object.DestroyOptions): Promise<this> {
        try {
            let result = await super.destroy(options);

            TreeNotice._notice$.next({
                crud: 'd',
                data: this,
            });

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Destory Without Notify
     */
    async destroy1(options?: Parse.Object.DestroyOptions): Promise<this> {
        try {
            let result = await super.destroy(options);

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save
     */
    async save(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(key: string, value: any, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(attrs: object, options?: Parse.Object.SaveOptions): Promise<this>;
    async save(arg1?, arg2?, arg3?): Promise<this> {
        try {
            let crud: 'c' | 'r' | 'u' | 'd' = !!this.id ? 'u' : 'c';
            let prev = crud === 'c' ? undefined : await new Parse.Query(this.className).equalTo('objectId', this.id).first();

            let result = await super.save(...arguments);

            if (crud === 'c') {
                TreeNotice._notice$.next({
                    crud: 'c',
                    data: this,
                });
            } else {
                TreeNotice._notice$.next({
                    crud: 'u',
                    data: this,
                    prev: prev,
                });
            }

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save Without Notify
     */
    async save1(attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(key: string, value: any, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(attrs: object, options?: Parse.Object.SaveOptions): Promise<this>;
    async save1(arg1?, arg2?, arg3?): Promise<this> {
        try {
            let result = await super.save(...arguments);

            return result;
        } catch (e) {
            throw e;
        }
    }

    public static async Validate(attr: any, ...args: any[]): Promise<any> {}
}

/**
 * Get Key Value Object
 * @param collection
 * @param objectIds
 */
export async function GetKeyValueObject<T extends Parse.Object>(collection: new () => T, objectIds: string[]): Promise<IKeyValueObject<T>> {
    try {
        let datas: T[] = await new Parse.Query(collection)
            .containedIn('objectId', objectIds as any)
            .limit(objectIds.length)
            .find();

        let result: IKeyValueObject<T> = {
            datas: datas,
            dataIdDirectory: {},
        };
        datas.forEach((value, index, array) => {
            let key: string = value.id;
            result.dataIdDirectory[key] = {
                objectId: value.id,
                name: value.get('name'),
            };
        });

        return result;
    } catch (e) {
        throw e;
    }
}

/**
 * Get Key Value Parse Object
 * @param collection
 * @param objectIds
 */
export async function GetKeyValueParseObject<T extends Parse.Object>(collection: new () => T, objectIds: string[]): Promise<IKeyValueParseObject<T>> {
    try {
        let datas: T[] = await new Parse.Query(collection)
            .containedIn('objectId', objectIds as any)
            .limit(objectIds.length)
            .find();

        let result: IKeyValueParseObject<T> = {
            datas: datas,
            dataIdDirectory: {},
        };
        datas.forEach((value, index, array) => {
            let key: string = value.id;
            result.dataIdDirectory[key] = value;
        });

        return result;
    } catch (e) {
        throw e;
    }
}

/**
 * Get All
 * @param collection
 * @param query
 */
export async function GetAll<T extends Parse.Object>(collection: new () => T): Promise<T[]>;
export async function GetAll<T extends Parse.Object>(collection: new () => T, query: Parse.Query<T>): Promise<T[]>;
export async function GetAll<T extends Parse.Object>(collection: new () => T, query?: Parse.Query<T>): Promise<T[]> {
    try {
        query = query || new Parse.Query(collection);

        let count: number = await query.count();

        let datas: T[] = await query.limit(count).find();

        return datas;
    } catch (e) {
        throw e;
    }
}
