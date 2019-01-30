import { ParseObject } from "helpers/parse-server/parse-helper";
import { Meta } from "helpers/utility/meta";
import { Mutex, Log } from "helpers/utility";
import { Tree } from "./tree";

const LogTitle = "Permission";

export interface IPermission<PermissionList, PermissionOf, Role1, Role2, Role3, Role4> {
    of: PermissionOf;

    /// abcd pick one
    a: Role1;
    b: Role2;
    c: Role3;
    d: Role4;

    access: PermissionList;
}

type ParseObjectClass = { new(): ParseObject<any> };

export interface IPermissionListArgs<PermissionOf, On> {
    of?: PermissionOf;
    on?: On;
}

export namespace Permission {
    export function Of<
        PermissionOf extends ParseObjectClass,
        T = PermissionOf extends { new(): infer A } ? A : never,
    >(permissionOf: PermissionOf) {
        return {
            With: <PermissionList>() => {

            return {
                On:
                <
                    Role1 extends ParseObjectClass,
                    Role2 extends ParseObjectClass,
                    Role3 extends ParseObjectClass,
                    Role4 extends ParseObjectClass,

                    U = Role1 extends { new(): infer A } ? A : never,
                    V = Role2 extends { new(): infer A } ? A : never,
                    K = Role3 extends { new(): infer A } ? A : never,
                    C = Role4 extends { new(): infer A } ? A : never,

                    PermissionOn = V extends never ? U :
                                   K extends never ? U | V :
                                   C extends never ? U | V | K :
                                   U | V | K | C
                >(role1: Role1, role2: Role2 = undefined, role3: Role3 = undefined, role4: Role4 = undefined) => {

                return class extends ParseObject<IPermission<PermissionList, T, U, V, K, C>> {
                    /// real functions of Permission
                    static async list<M extends ParseObject<any>>(this: new() => M, options?: IPermissionListArgs<T, PermissionOn>): Promise<M[]> {
                        let thisClass: { new(): M } = this;
                        let query = new Parse.Query<M>(thisClass);
                        if (options) {
                            options.of && (query = query.equalTo("of", options.of));
                            let on = options.on;
                            if (on) {
                                if (on instanceof role1) query = query.equalTo("a", on);
                                else if (on instanceof role2) query = query.equalTo("b", on);
                                else if (on instanceof role3) query = query.equalTo("c", on);
                                else if (on instanceof role4) query = query.equalTo("d", on);
                            }
                        }
                        return query.find();
                    }

                    static async set<M extends keyof PermissionList>(of: T, on: PermissionOn, key: M, value: PermissionList[M]): Promise<void>;
                    static async set(of: T, on: PermissionOn, access: PermissionList): Promise<void>;
                    static async set<M extends keyof PermissionList>(of: T, on: PermissionOn, access: PermissionList | M, value?: PermissionList[M]): Promise<void> {
                        if (!of) throw Log.Error(LogTitle, "<of> should not be null.");
                        if (!on) throw Log.Error(LogTitle, "<on> should not be null.");

                        let mtx: Mutex = this.getMutex();
                        await mtx.acquire();
                        
                        try {

                        /// unify obj first
                        let accessObj: PermissionList = (typeof access === 'string') ? { [access]: value } : access as any;

                        /// already exists case
                        let list = await this.list({ of, on });
                        if (list.length > 0) {
                            let instance = list[0];
                            accessObj = (typeof access === 'string') ? { ...instance.getValue("access") as any, ...accessObj as any } : accessObj;
                            instance.setValue("access", accessObj);
                            await instance.save();
                            return;
                        }

                        let thisClass: any = this;

                        let options: any = { of, access: accessObj };
                        if (on instanceof role1) options.a = on;
                        else if (on instanceof role2) options.b = on;
                        else if (on instanceof role3) options.c = on;
                        else if (on instanceof role4) options.d = on;
                        let obj = new (thisClass)(options);
                        await obj.save();

                        } catch(e) { return Promise.reject(e) }
                        finally { mtx.release(); }

                        return null;
                    }

                    static async verify<M extends keyof PermissionList>(of: T, on: PermissionOn | PermissionOn[], key: M): Promise<PermissionList[M]> {
                        if (!Array.isArray(on)) on = [on];

                        /// if data is Tree<T>, flattern into array of child/parent. if not, return array of data.
                        let flattern = async (data /*: ParseObject<any> | Tree<any>*/) => {
                            if (data instanceof Tree && Meta.get(data.constructor).container) {
                                let leafs = await data.getParentLeafs();
                                return [data, ...leafs];
                            } else {
                                return [data];
                            }
                        }

                        /// for loop each "of"
                        let result = undefined;
                        main: for (let eachOf of await flattern(of)) {
                            /// for loop each "on"
                            for (let eachOn of on) {
                                /// for loop each "flatOn"
                                for (let flatOn of await flattern(eachOn)) {
                                    /// verify permission between eachOf -> flatOn
                                    /// todo: may make it faster
                                    let permissions = await this.list({ of: eachOf, on: flatOn });
                                    if (permissions.length === 0) continue;
                                    let attrs: IPermission<PermissionList, T, U, V, K, C> = permissions[0].attributes;
                                    let attr = attrs.access[key];
                                    if (attr !== undefined) { result = attr; break main; }
                                    continue;
                                }
                            }
                        }

                        return result;
                    }
                    // static get<M>(this: this: new() => M, permissionOf: T, on: PermissionOn[]): PermissionList {
                    //     return null;
                    // }

                    /// private
                    /*private*/ static getMutex(): Mutex {
                        let obj = new Set([this, role1, role2, role3, role4]);
                        return Meta.get(obj, "mutex", () => new Mutex());
                    }
                }

                }
            }

            }
        }
    }
}
