/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

/// Express
import * as express from 'express';
import * as request from 'request';
import * as WSSocket from 'ws';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router, NextFunction, RequestHandler } from 'express/lib/router/index';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

/// Parse & define
import { RoleList, IRole } from 'core/userRoles.gen';
//import * as Socket from 'ws';
import { Socket } from 'helpers/sockets/socket-helper';
import { Errors, IInputPaging, IOutputPaging } from 'core/errors.gen';
import { Config } from 'core/config.gen';

/// Middlewares
import * as Middlewares from 'helpers/middlewares/index';

/// Helpers
export * from './../parse-server/user-helper';
export * from './../parse-server/file-helper';
export * from './../parse-server/parse-helper';
export * from './../sockets/socket-helper';
import { omitObject } from './../utility/omit-object';
import { ParseObject, ParseObjectJSONRule, retrievePrimaryClass } from './../parse-server/parse-helper';
import CRUDMaker from 'shells/crud.shell';
import ServerMaker from 'shells/server-maker.shell';
import { O, _O } from 'helpers/utility/O';
import { getEnumKeyArray } from 'helpers/utility/get-enum-key';
const caller = require('caller');

/// private middlewares
import { VBodyParserJson, VBodyParserRaw } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { apiPermissionCheck } from './private-middlewares/api-permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { inputType } from './private-middlewares/input-type';
import { transform } from './private-middlewares/transform';
import { Log, Mutex, retry } from 'helpers/utility';
import { BehaviorSubject, Subject } from 'rxjs';
import { IncomingMessage } from 'http';
import { UserHelper } from 'helpers/parse-server/user-helper';
import { Tree } from 'models/nodes';
import CollectionWatcher from 'helpers/mongodb/collection-watcher';


let connectedSockets: { [sid: string]: Socket[] } = {};
/// connected socket being kick out handler
(async () => {
    (await CollectionWatcher.watch("_Session"))
        .subscribe( (change) => {
            if (change.operationType !== 'delete') return;
            let sid = change.documentKey._id;
            (connectedSockets[sid] || []).forEach( (socket) => {
                socket.send({statusCode: 401, message: "Session being logged out."});
                socket.closeGracefully();
            });
        });
})();


export interface ActionConfig<T = any, U = any> {
    /**
     * How to describe this action? ex: Create a new user.
     * Default = none.
     */
    description?: string;

    /**
     * Which path apply to route?
     * Default = *
     */
    path?: string;

    /**
     * Which middlewares should be injected into route?
     * Default = none.
     */
    middlewares?: any[];
}

export interface ActionCallback<T, U> {
    (data: ActionParam<T>): U | Promise<U>;
}

export interface ActionParam<T> {
    socket: Socket;
    request: Request;
    response: Response;
}

type ActionTypes = "All" | "Get" | "Post" | "Put" | "Delete" | "Ws";
let actionTypes: ActionTypes[] = ["All", "Get", "Post", "Put", "Delete", "Ws"];

export class Action<T = any, U = any> {
    config: ActionConfig;
    caller: string;
    uri: string;

    constructor(config: ActionConfig<T, U>) {
        this.caller = caller();
        this.config = config;
    }

    _get(type, arg1, arg2 = null) {
        var callback = arg2 || arg1; if (arg2) this[`func${type}Config`] = typeof arg1 === 'string' ? { path: arg1 } : arg1; this[`func${type}`] = <any>callback; return this;
    }

    list(): ActionTypes[] {
        return actionTypes.reduce( (final, value) => {
            this[`func${value}`] && (final.push(value));
            return final;
        }, []);
    }

    /**
     * count number of apis
     */
    count(): number {
        let count = 0;
        let data = actionTypes;
        for (let key of data) {
            this[`func${key}`] && count++;
        }
        return count;
    }
    public static count(actions: Action[]) {
        return (actions||[]).reduce( (final, action) => {
            return final + action.count();
        }, 0);
    }

    public funcAllConfig: ActionConfig;
    private funcAll: ActionCallback<T, U>;
    all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

    public funcGetConfig: ActionConfig;
    private funcGet: ActionCallback<T, U>;
    get<K = null, V = null>(path: string | ActionConfig<K, V>, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get(arg1, arg2 = null) { return this._get("Get", arg1, arg2); }

    public funcPostConfig: ActionConfig;
    private funcPost: ActionCallback<T, U>;
    post<K = null, V = null>(path: string | ActionConfig<K, V>, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post(arg1, arg2 = null) { return this._get("Post", arg1, arg2); }

    public funcPutConfig: ActionConfig;
    private funcPut: ActionCallback<T, U>;
    put<K = null, V = null>(path: string | ActionConfig<K, V>, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put(arg1, arg2 = null) { return this._get("Put", arg1, arg2); }

    public funcDeleteConfig: ActionConfig;
    private funcDelete: ActionCallback<T, U>;
    delete<K = null, V = null>(path: string | ActionConfig<K, V>, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete(arg1, arg2 = null) { return this._get("Delete", arg1, arg2); }

    public funcWsConfig: ActionConfig;
    private funcWs: ActionCallback<T, U>;
    ws<K = null, V = null>(path: string | ActionConfig<K, V>, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws(arg1, arg2 = null) { return this._get("Ws", arg1, arg2); }

    /// translate ActionConfig to array of middlewares
    configTranslate(config: ActionConfig, caller: string): any[] {
        var middlewares = [];
        if (!config && !this.config) return middlewares;
        /////////////////////////////////////////////
        /// mount middlewares
        let fetchConfig = <T extends keyof ActionConfig>(key: T): ActionConfig[T] => {
            return O(config)[key] || O(this.config)[key];
        }

        /// 1) bodyParser
        let cfPostSizeLimit = fetchConfig("postSizeLimit");
        let cfTransform = fetchConfig("transform");

        if (!cfTransform) {
            middlewares.push(
                VBodyParserJson( cfPostSizeLimit ? { limit: cfPostSizeLimit } : null )
            );
        } else {
            middlewares.push( VBodyParserRaw() );
            middlewares.push( transform(cfTransform) );
        }

        /// 2) login
        let cfLoginRequired = fetchConfig("loginRequired");
        middlewares.push(loginRequired(cfLoginRequired));

        /// 3) permission
        let cfPermission = fetchConfig("permission");
        cfPermission && middlewares.push(permissionCheck(cfPermission));
        /// 4) api permission
        let cfApiPermission = fetchConfig("apiToken");
        cfApiPermission && middlewares.push(apiPermissionCheck(cfApiPermission));

        /// 5) inputType
        let cfInputType = fetchConfig("inputType");
        cfInputType && middlewares.push(inputType(caller, cfInputType));
        /// mount others
        let cfMiddlewares = fetchConfig("middlewares");
        cfMiddlewares && (middlewares = [...middlewares, ...cfMiddlewares]);
        /////////////////////////////////////////////

        return middlewares;
    }
    transferSocketMiddleware(middlewares: any[]) {
        return middlewares.map( (middleware) => {
            return (info, cb, next) => {
                middleware(info.req, info.res, next);
            }
        });
    }

    mount(): Router {
        var router: Router = express.Router();

        /// mount middlewares
        //router.use(this.configTranslate(this.config, this.caller));

        var funcs = ["All", "Get", "Post", "Put", "Delete"];
        for (var func of funcs) {
            if (this[`func${func}`]) {
                let realfunc = this[`func${func}`];
                let config: ActionConfig = this[`func${func}Config`];
                let realpath = (config ? config.path : "*") || "*";
                router[func.toLowerCase()](realpath, this.configTranslate(config, this.caller), mergeParams,
                    async (request: Request, response: Response, next: NextFunction) => {
                        try {
                            var result = await realfunc({...request ,request, response});
                            /// don't do anything, if delegate doesn't return
                            if (result === undefined) return;
                            response.send(result);
                        } catch(reason) {
                            next(reason);
                        }
                    }
                );
            }
        }
        /// ws
        if (this.funcWs) {
            let realfunc = this.funcWs;
            let config: ActionConfig = this.funcWsConfig;
            let realpath = (config ? config.path : "*") || "*";
            router["websocket"](realpath, ...this.transferSocketMiddleware(this.configTranslate(config, this.caller)), mergeParams,
                async (info: ExpressWsRouteInfo, cb: ExpressWsCb, next: NextFunction) => {
                    var request = <any>info.req;
                    var response = <any>info.res;
                    var socket = await Socket.get(info, cb);
                    let sid = (request.session || {}).id;
                    /// insert connected socket. ignore loginRequired == false
                    sid && ( connectedSockets[sid] || (connectedSockets[sid] = []) ).push(socket);

                    /// auto update session ///////////////////////
                    if (Config.core.sessionExpireSeconds >= 0 && request.session) {
                        let sessionId: string = request.session.id;
                        /// tick maximum to 30 minutes
                        let tick: number = Math.min(Config.core.sessionExpireSeconds*1000/2, 30*60*1000);
                        let intv = setInterval( () => {
                            UserHelper.extendSessionExpires(sessionId);
                        }, tick );
                        socket.io.addListener("close", () => {
                            clearInterval(intv);

                            /// remove connected socket
                            if (!sid) return;
                            let sockets = connectedSockets[sid];
                            if (!sockets) return;
                            let idx = sockets.findIndex( v => v === socket );
                            sockets.splice(idx, 1);
                        })
                    }
                    ///////////////////////////////////////////////

                    try {
                        var result = await realfunc({...request, request, response, socket});
                    } catch(reason) {
                        next(reason);
                    }

                    /// send 200 ok
                    socket.send({statusCode: 200});
                }
            );
        }
        return router;
    }
}


export namespace Restful {

    export interface Option {
        paging?: boolean;
        parseObject?: boolean;
    }

    export interface ValidObject {
        objectId: string;
    }

    export type InputC<T> = T;
    export type OutputC<T, K extends Option = {
        parseObject: true
    }, U = K extends { parseObject: false } ? T : ParseObject<T> >
         = U;

    export type InputR<T, K extends Option = {
        paging: true
    }, U = K extends { paging: false } ? Partial<T> : IInputPaging<Partial<T>> >
       = U & Partial<ValidObject>;
    export type OutputR<T, K extends Option = {
        paging: true,
        parseObject: true,
    }, U = K extends { parseObject: false } ? T : ParseObject<T>,
       V = K extends { paging: false } ? U : IOutputPaging<U> >
       = V;

    export type InputU<T> = ValidObject & Partial<T>;
    export type OutputU<T, K extends Option = {
        parseObject: true
    }, U = K extends { parseObject: false } ? T : ParseObject<T> >
         = U;

    export type InputD<T> = InputU<T>;
    export type OutputD<T, K extends Option = {
        parseObject: true
    }> = OutputU<T, K>;

    export function Filter<T extends Parse.Object = any>(query: Parse.Query<T>, params: object): Parse.Query<T> {
        /// remove paging
        var ps :any = { ...params, paging: undefined };
        //console.log('ps',ps);
        /// including others
        // for (var p in ps) query = query.equalTo(p, ps[p]);
        function queryFilter(query: Parse.Query<T>, params: object, prefix: string = null) {
         //console.log('prefix', prefix, params);
            if (Array.isArray(params)) return query.containedIn(prefix, params);
            if (params instanceof Parse.Object ||
                params instanceof Parse.User
                ) return query.equalTo(`${prefix}`, params);
            if (typeof params === 'object') {
                for (let key in params) {
                    if(key=="sorting" || key=="filtering")continue;
                    queryFilter(query, params[key], (prefix ? `${prefix}.` : '') + key);
                }
                return;
            }            
            return query.equalTo(prefix, params);

        }
        queryFilter(query, ps);
        //sorting
        if(ps.sorting && ps.sorting.order !=undefined && ps.sorting.field){
           
            if(!ps.sorting.order) query.ascending(ps.sorting.field);
            else query.descending(ps.sorting.field);
        }
        //filtering
        if(ps.filtering && ps.filtering.field && ps.filtering.value){
            query.matches(ps.filtering.field, new RegExp(ps.filtering.value), "i");
        }
        return query;
    }

    export async function Pagination<T extends Parse.Object = any>(query: Parse.Query<T> | any[], params: IInputPaging<any>, filter: any = null, tuner: ((input: T[])=> Promise<T[]>) = null): Promise<IOutputPaging<any>> {
        var paging = params.paging || {};
        var page = +(paging.page || 1);
        var pageSize = +(paging.pageSize || 20);
        var all = "true" == paging.all;
        if (all) pageSize = Number.MAX_SAFE_INTEGER;
        let total = 0, totalPages = 0;
        let results;

        if (query instanceof Parse.Query) {
            total = await query.count();
            totalPages = Math.ceil(total / pageSize);
            page = Math.max(Math.min(page, totalPages), 1);
            var o = await query.limit(pageSize).skip( (page-1) * pageSize ).find();
    
            if (tuner) o = await tuner(o);
            results = o.map( (data) => ParseObject.toOutputJSON(data, filter) );

        } else {
            total = query.length;
            totalPages = Math.ceil(total / pageSize);
            if (all) results = query;
            else results = query.slice( (page-1) * pageSize, page * pageSize );
            if (tuner) results = await tuner(results);
            results = results.map( (data) => ParseObject.toOutputJSON(data, filter) );
        }

        if (all) return { paging: {total}, results };
        return { paging: {page, pageSize, total, totalPages}, results };
    }

    export interface CRUDOptions {
        includeAll?: boolean;
        deleteSubObjects?: boolean;
    }
    export function CRUD(className: string, options: CRUDOptions = {}) {
        const defaultCRUDOptions: CRUDOptions = {
            includeAll: true,
            deleteSubObjects: true
        }
        options = { ...defaultCRUDOptions, ...options };

        let realClass = retrievePrimaryClass(className);
        let isClass = realClass ? true : false;
        let isTree = isClass && new realClass() instanceof Tree ? true : false;

        if ( (!isClass && className[0] === 'I') || isClass ) {
            /// handle interface & class
            CRUDMaker(caller(), className, options, isClass, isTree);

        } else {
            throw `Internal Error: <${className}> should be a valid object for CRUD.`;
        }
    }

    /// Server
    export type ApisType = 'All' | 'Get' | 'Post' | 'Put' | 'Delete' | 'Ws';
    export type ApisPathObject = {
        [K in ApisType]?: {
            input: string;
            output: string;
            loginRequired: boolean;
        }
    }
    export interface ApisOutput {
        [path: string]: ApisPathObject;
    }

    interface IServerConfig {
        ip: string;
        port: number;
        account: string;
        password: string;
        loginPath?: string; /// default as /users/login
    }
    export function Server(config: IServerConfig, typeless: boolean = true) {
        config.loginPath = config.loginPath || "/users/login";
        let callerz = caller();
        (async () => {

            let { ip, port, account: username, password } = config;
            const LogTitle = "Restful.Server";
    
            do {
            /// 1) connect server
            let sessionId: string;
            try {
                sessionId = await new Promise<string>( (resolve, reject) => {
                    /// login first
                    request({
                        url: `http://${config.ip}:${config.port}${config.loginPath}`,
                        method: 'POST',
                        json: true,
                        body: { username, password }
                    }, (err, res, body) => {
                        if (res.statusCode !== 200) return reject(body);
                        resolve(body.sessionId);
                    });
                });
            } catch(e) {
                Log.Error(LogTitle, e);
                break;
            }
    
            /// 2) load apis
            let apis: ApisOutput;
            try {
                apis = await new Promise<ApisOutput>( (resolve, reject) => {
                    request({
                        url: `http://${config.ip}:${config.port}/apis?sessionId=${sessionId}`,
                        method: 'GET',
                        json: true
                    }, (err, res, body) => {
                        if (res.statusCode !== 200) return reject(body);
                        resolve(body);
                    });
                });
            } catch(e) {
                Log.Error(LogTitle, e);
                break;
            }
            ServerMaker(callerz, apis, typeless);
            
            } while(0);
            
        })();
    }

    /// Server Implement
    export interface ApisRequestArg {
        [path: string]: [any, any, boolean];
    }
    export type ApisRequestBase = {
        [K in ApisType]?: ApisRequestArg;
    }

    type ApisExtractInput<T> = T extends [infer K, infer U, infer V] ? K : never;
    type ApisExtractOutput<T> = T extends [infer K, infer U, infer V] ? U : never;
    type ApisExtractLoginRequired<T> = T extends [infer K, infer U, infer V] ? V : never;
    type ApisSessionRequired = { sessionId: string };

    interface IiSAPServerBaseConfig {
        ip: string;
        port: number;
    }
    export interface IGeneralRequestError {
        errno: string;
        code: string;
        syscall: string;
        hostname: string;
        host: string;
        port: string;
    }
    
    export interface IGeneralRequestRejection {
        err: IGeneralRequestError;
        res: IncomingMessage;
        body: any;
    }
    
    export class iSAPServerBase<T extends ApisRequestBase, W extends IiSAPServerBaseConfig = IiSAPServerBaseConfig> {
        protected config: W;
        protected sessionId: string = null;
        protected sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
        constructor(config: W) {
            this.config = config;
        }

        private makeUrl(uri: string, ws: boolean = false): string {
            return `${ws ? 'ws' : 'http'}://${this.config.ip}:${this.config.port}${uri}`;
        }

        async C<
            K extends keyof T["Post"],
            U extends ApisExtractInput<T["Post"][K]>,
            V extends ApisExtractOutput<T["Post"][K]>,
            P extends ApisExtractLoginRequired<T["Post"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'POST' | 'PUT' = 'POST'): Promise<V> {

            if (!data) data = {} as any;
            /// apply sessionId
            this.sessionId && (data.sessionId = this.sessionId);

            return new Promise<V>( (resolve, reject) => {
                request({
                    url: this.makeUrl(key as string),
                    method: spec,
                    json: true,
                    body: data
                }, (err, res, body) => {
                    if (err) return reject({err});
                    if (res.statusCode !== 200) return reject({res, body});
                    /// handle sessionId
                    if (body.sessionId && /login/.test(key as string)) {
                        this.sessionId = body.sessionId;
                        this.sjLogined.next(true);
                    }
                    resolve(body);
                });
            });
        
        }

        async R<
            K extends keyof T["Get"],
            U extends ApisExtractInput<T["Get"][K]>,
            V extends ApisExtractOutput<T["Get"][K]>,
            P extends ApisExtractLoginRequired<T["Get"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'GET' | 'DELETE' = 'GET'): Promise<V> {

            if (!data) data = {} as any;
            /// apply sessionId
            this.sessionId && (data.sessionId = this.sessionId);

            /// todo: stringify data
            let params = Object.keys(data).map( (k) => `${k}=${data[k]}` ).join("&");

            return new Promise<V>( (resolve, reject) => {
                request({
                    url: `${this.makeUrl(key as string)}?${params}`,
                    method: spec,
                    json: true,
                }, (err, res, body) => {
                    if (err) return reject({err});
                    if (res.statusCode !== 200) return reject({res, body});
                    /// handle sessionId
                    if (body.sessionId && /login/.test(key as string)) {
                        this.sessionId = body.sessionId;
                        this.sjLogined.next(true);
                    }
                    resolve(body);
                });
            });
                    
        }

        async U<
            K extends keyof T["Put"],
            U extends ApisExtractInput<T["Put"][K]>,
            V extends ApisExtractOutput<T["Put"][K]>,
            P extends ApisExtractLoginRequired<T["Put"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data: U): Promise<V> {
            
            return this.C(key, data, 'PUT');
        }

        async D<
            K extends keyof T["Delete"],
            U extends ApisExtractInput<T["Delete"][K]>,
            V extends ApisExtractOutput<T["Delete"][K]>,
            P extends ApisExtractLoginRequired<T["Delete"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data: U): Promise<V> {
            
            return this.R(key, data, 'DELETE');
        }

        async WS<
            K extends keyof T["Ws"],
            U extends ApisExtractInput<T["Ws"][K]>,
            V extends ApisExtractOutput<T["Ws"][K]>,
            P extends ApisExtractLoginRequired<T["Ws"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K): Promise<Socket> {
            
            // return new Promise<Socket>( (resolve, reject) => {
            //     const url = `${this.makeUrl(key as string, true)}?sessionId=${this.sessionId}`;
            //     const ws = new WSSocket(url);
            //     ws.on("open", async () => {
            //         resolve( await Socket.get(ws) )
            //     });
            // });

            return new Promise<Socket>( (resolve, reject) => {
                const url = `${this.makeUrl(key as string, true)}?sessionId=${this.sessionId}`;
                const ws = new WSSocket(url);
                ws.on("error", (err) => {
                    reject({err});
                });
                ws.on("open", async () => {
                    let socket = await Socket.get(ws);
                    let callback = (data) => {
                        let result = JSON.parse(data);
                        do {
                            if (result.statusCode===200) { resolve(socket); break; }
                            reject({
                                res: { statusCode: result.statusCode },
                                body: result.message
                            });
                        } while(0);
                        socket.io.removeListener("message", callback);
                    }
                    socket.io.addListener("message", callback);
                });
            });
        }

        getSessionId(): string { return this.sessionId; }
    }

    interface IiSAPServerAutoConfig extends IiSAPServerBaseConfig {
        username: string;
        password: string;
        loginPath?: string;
    }
    export class iSAPAutoServerBase<T extends ApisRequestBase, W extends IiSAPServerAutoConfig = IiSAPServerAutoConfig> extends iSAPServerBase<T, W> {
        protected sjRequestLogin: Subject<void> = new Subject<void>();
        protected mtxLogin: Mutex = new Mutex();
        constructor(config: W) {
            super(config);
            config.loginPath = config.loginPath || "/users/login";
            this.sjRequestLogin.subscribe( () => this.doLogin() );
        }

        private async doLogin() {
            if (this.mtxLogin.isLocked()) return;
            await this.mtxLogin.acquire();
            this.sjLogined.next(false);
            
            let { username, password } = this.config;
            this.C(this.config.loginPath, {
                username, password
            } as any)
            .then( () => {
                this.mtxLogin.release();
            })
            .catch( (e: IGeneralRequestRejection) => {
                Log.Error(this.constructor.name, `Auto login failed: ${JSON.stringify(e)}`);
                this.mtxLogin.release();
                // setTimeout(() => this.doLogin(), 1000);
            });
        }

        private waitForLogin(): Promise<boolean> {
            return this.sjLogined.filter(v=>v).first().toPromise();
        }

        private rejection(e: IGeneralRequestRejection): boolean {
            return (e.res && e.res.statusCode===403) ? true : false;
        }

        async C<
            K extends keyof T["Post"],
            U extends ApisExtractInput<T["Post"][K]>,
            V extends ApisExtractOutput<T["Post"][K]>,
            P extends ApisExtractLoginRequired<T["Post"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'POST' | 'PUT' = 'POST'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                if (key !== this.config.loginPath) {
                    this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                    await this.waitForLogin();
                }
                super.C(key, data, spec)
                    .then( resolve )
                    .catch( async (e: IGeneralRequestRejection) => {
                        /// don't do relogin if rejection
                        if (this.rejection(e)) return reject(e);
                        this.sjRequestLogin.next();
                        await this.waitForLogin();
                        reject(e);
                    });
            }, 0, "iSAPServerC", this.rejection );
        }

        async R<
            K extends keyof T["Get"],
            U extends ApisExtractInput<T["Get"][K]>,
            V extends ApisExtractOutput<T["Get"][K]>,
            P extends ApisExtractLoginRequired<T["Get"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'GET' | 'DELETE' = 'GET'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                if (key !== this.config.loginPath) {
                    this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                    await this.waitForLogin();
                }

                super.R(key, data, spec)
                    .then( resolve )
                    .catch( async (e) => {
                        this.sjRequestLogin.next();
                        await this.waitForLogin();
                        reject(e);
                    });
            }, 0, "iSAPServerC");
        }

        async WS<
            K extends keyof T["Ws"],
            U extends ApisExtractInput<T["Ws"][K]>,
            V extends ApisExtractOutput<T["Ws"][K]>,
            P extends ApisExtractLoginRequired<T["Ws"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K): Promise<Socket> {

            return retry<Socket>( async (resolve, reject) => {
                this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                await this.waitForLogin();

                super.WS(key)
                    .then( resolve )
                    .catch( (e) => {
                        console.log('reject!', e);
                        reject(e);
                    });

                //let ws = await super.WS(key);

                // let callback = (data) => {
                //     let result = JSON.parse(data);
                //     do {
                //         if (result.statusCode===200) { resolve(ws); break; }
                //         reject(result);
                //     } while(0);
                //     ws.io.removeListener("message", callback);
                // }
                // ws.io.addListener("message", callback);
            });
        }
    }

}

