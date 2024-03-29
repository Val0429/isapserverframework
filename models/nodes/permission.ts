/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as util from 'util';
import { ParseObject } from "helpers/parse-server/parse-helper";
import { Meta } from "helpers/utility/meta";
import { Mutex, Log, jsMapAssign } from "helpers/utility";
import { Tree } from "./tree";
import { Schedule } from './schedule';
import { BehaviorSubject } from 'rxjs';
import { CacheParse } from 'helpers/parse-server/cache-helper';

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

type ParseObjectClass = { new(...args): ParseObject<any> };

export interface IPermissionListArgs<PermissionOf, On> {
    of?: PermissionOf;
    on?: On;
}

export interface IPermissionVerifyConfig {
    date?: Date;
    CParse?: CacheParse;
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

                    U = Role1 extends { new(...args): infer A } ? A : never,
                    V = Role2 extends { new(...args): infer A } ? A : never,
                    K = Role3 extends { new(...args): infer A } ? A : never,
                    C = Role4 extends { new(...args): infer A } ? A : never,

                    PermissionOn = V extends never ? U :
                                   K extends never ? U | V :
                                   C extends never ? U | V | K :
                                   U | V | K | C
                >(role1: Role1, role2: Role2 = undefined, role3: Role3 = undefined, role4: Role4 = undefined) => {

                return class extends ParseObject<IPermission<PermissionList, T, U, V, K, C>> {
                    /// real functions of Permission
                    /**
                     * List all related permission. of + on
                     */
                    static async list<M extends ParseObject<any>>(this: new() => M, options?: IPermissionListArgs<T, PermissionOn>, CParse?: CacheParse): Promise<M[]> {
                        let thisClass: { new(): M } = this;
                        let query = CParse ? CParse.Query(thisClass) : new Parse.Query<M>(thisClass).include("of").include("a").include("b").include("c").include("d");
                        if (options) {
                            options.of && (query = query.equalTo("of", options.of));
                            let on = options.on;
                            if (on) {
                                if (on instanceof role1) query = query.equalTo("a", on);
                                else if (role2 && on instanceof role2) query = query.equalTo("b", on);
                                else if (role3 && on instanceof role3) query = query.equalTo("c", on);
                                else if (role4 && on instanceof role4) query = query.equalTo("d", on);
                                else {
                                    /// Schedule related object should not goes here
                                    throw `<Permission> exception class - ${util.inspect(on)}`;
                                }
                            }
                        }
                        return query.find();
                    }

                    static async set<M extends keyof PermissionList>(of: T, on: PermissionOn, key: M, value: PermissionList[M]): Promise<any>;
                    static async set(of: T, on: PermissionOn, access: PermissionList): Promise<any>;
                    static async set<M extends keyof PermissionList>(of: T, on: PermissionOn, access: PermissionList | M, value?: PermissionList[M]): Promise<any> {
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
                            return instance;
                        }

                        let thisClass: any = this;

                        let options: any = { of, access: accessObj };
                        if (on instanceof role1) options.a = on;
                        else if (on instanceof role2) options.b = on;
                        else if (on instanceof role3) options.c = on;
                        else if (on instanceof role4) options.d = on;
                        let obj = new (thisClass)(options);
                        await obj.save();
                        return obj;

                        } catch(e) { return Promise.reject(e) }
                        finally { mtx.release(); }
                    }

                    static async verify<M extends keyof PermissionList>(of: T, on: PermissionOn | PermissionOn[], config?: IPermissionVerifyConfig): Promise<PermissionList>;
                    static async verify<M extends keyof PermissionList>(of: T, on: PermissionOn | PermissionOn[], key: M, config?: IPermissionVerifyConfig): Promise<Pick<PermissionList, M>>;
                    static async verify<M extends keyof PermissionList>(of: T, on: PermissionOn | PermissionOn[], key: M | IPermissionVerifyConfig, config?: IPermissionVerifyConfig): Promise<PermissionList | Pick<PermissionList, M>> {
                        if (typeof key !== 'string') {
                            config = key as any; key = undefined;
                        }

                        if (!config) config = {};
                        let CParse: CacheParse = config.CParse || undefined;
                        let result: any = {};
                        /// closure start /////////////
                        try { if (!CParse) CParse = new CacheParse();
                        ///////////////////////////////

                        if (!Array.isArray(on)) on = [on];
                        /// if data is Tree<T>, flattern into array of child/parent. if not, return array of data.
                        let flattern = async (data /*: ParseObject<any> | Tree<any>*/) => {
                            /// for Tree /w container, check all parent leafs for permission
                            if (data instanceof Tree && Meta.get(data.constructor).container) {
                                let leafs = await data.getParentLeafs(CParse);
                                return [data, ...leafs];
                            } else {
                                return [data];
                            }
                        }

                        let roleList = [role1, role2, role3, role4];
                        let flatOf = await flattern(of);
                        /// 1) scan all roles
                        main: for (let role of roleList) {
                            if (!role) break;
                            /// 2) Schedule case
                            if (role.prototype instanceof Schedule) {
                                /// 2.1) for loop flatterned of
                                for (let eachOf of flatOf) {
                                    let query = CParse.Query(role);
                                    /// 2.1.1) map back to query
                                    for (let item of [eachOf, ...on]) {
                                        for (let target of ["who", "where", "what", "how", "others"]) {
                                            if (role[target] && item instanceof role[target]) {
                                                query.equalTo(target, item);
                                            }
                                        }
                                    }
                                    /// 2.1.2) execute
                                    let schedules = await query.find();
                                    /// 2.2) build schedules into Calendar for match
                                    let date = config.date || new Date();
                                    let calendar = (await (role as any).buildCalendar(schedules, {start: date})).matchTime(date);
                                    if (calendar.length > 0) {
                                        let permissions = await this.list({ of: eachOf, on: calendar[0].data }, CParse);
                                        if (permissions.length === 0) continue;
                                        // console.log('get permission...', calendar, permissions);
                                        let attrs: IPermission<PermissionList, T, U, V, K, C> = permissions[0].attributes;
                                        if (key) {
                                            let attr = attrs.access[key as M];
                                            if (attr !== undefined) { result[key] = attr; break main; }
                                        } else {
                                            for (let key in attrs.access) {
                                                if (result[key] !== undefined) continue;
                                                let value = attrs.access[key];
                                                result[key] = value;
                                            }
                                        }
                                    }
                                }
                            } else {
                            /// 3) Normal case
                                /// 3.1) for loop flatterned of
                                for (let eachOf of flatOf) {
                                    let idx = on.findIndex((value) => value instanceof role);
                                    if (idx < 0) continue;
                                    for (let flatOn of await flattern(on[idx])) {
                                        /// verify permission between eachOf -> flatOn
                                        let permissions = await this.list({ of: eachOf, on: flatOn }, CParse);
                                        if (permissions.length === 0) continue;
                                        let attrs: IPermission<PermissionList, T, U, V, K, C> = permissions[0].attributes;
                                        if (key) {
                                            let attr = attrs.access[key as M];
                                            if (attr !== undefined) { result[key] = attr; break main; } 
                                        } else {
                                            for (let key in attrs.access) {
                                                if (result[key] !== undefined) continue;
                                                let value = attrs.access[key];
                                                result[key] = value;
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        /// for loop each "of"
                        /// 1) of should not be Schedule. directly flattern.
                        // main: for (let eachOf of await flattern(of)) {
                        //     /// 2) scan all roles
                        //     for (let role of [role1, role2, role3, role4]) {
                        //         if (!role) break;
                        //         /// 2.1) Schedule case
                        //         if (role.prototype instanceof Schedule) {
                        //             let query = CParse.Query(role);
                        //             for (let item of [eachOf, ...on]) {
                        //                 for (let target of ["who", "where", "what", "how", "others"]) {
                        //                     if (role[target] && item instanceof role[target]) {
                        //                         query.equalTo(target, item);
                        //                     }
                        //                 }
                        //             }
                        //             let schedules = await query.find();
                        //             /// 2.1.1) build schedules into Calendar for match
                        //             let date = config.date || new Date();
                        //             let calendar = (await (role as any).buildCalendar(schedules, {start: date})).matchTime(date);
                        //             if (calendar.length > 0) {
                        //                 let permissions = await this.list({ of: eachOf, on: calendar[0].data }, CParse);
                        //                 if (permissions.length === 0) continue;
                        //                 // console.log('get permission...', calendar, permissions);
                        //                 let attrs: IPermission<PermissionList, T, U, V, K, C> = permissions[0].attributes;
                        //                 let attr = attrs.access[key];
                        //                 // console.log('final attr!', attrs, key)
                        //                 if (attr !== undefined) { result = attr; break main; }
                        //             }

                        //         } else {
                        //         /// 2.2) Normal case
                        //             let idx = on.findIndex((value) => value instanceof role);
                        //             if (idx < 0) continue;
                        //             for (let flatOn of await flattern(on[idx])) {
                        //                 /// verify permission between eachOf -> flatOn
                        //                 let permissions = await this.list({ of: eachOf, on: flatOn }, CParse);
                        //                 if (permissions.length === 0) continue;
                        //                 let attrs: IPermission<PermissionList, T, U, V, K, C> = permissions[0].attributes;
                        //                 let attr = attrs.access[key];
                        //                 if (attr !== undefined) { result = attr; break main; } 
                        //             }
                        //         }
                        //     }
                        // }

                        /// closure end ///////////////
                        } catch(e) {} finally { if (!config.CParse) CParse.dispose() }
                        ///////////////////////////////
                   
                        return result;
                    }

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

