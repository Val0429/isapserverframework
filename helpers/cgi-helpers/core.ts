/// Express
import * as express from 'express';
import * as request from 'request';
import * as WSSocket from 'ws';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router, NextFunction, RequestHandler } from 'express/lib/router/index';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

/// Parse & define
import * as Parse from 'parse/node';
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
var caller = require('caller');

/// private middlewares
import { VBodyParserJson, VBodyParserRaw } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { inputType } from './private-middlewares/input-type';
import { transform } from './private-middlewares/transform';
import { Log, Mutex, retry } from 'helpers/utility';
import { BehaviorSubject, Subject } from 'rxjs';


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
        return actions.reduce( (final, action) => {
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
            return _O(this.config)[key] || _O(config)[key];
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
        cfLoginRequired && middlewares.push(loginRequired);
        /// 3) permission
        let cfPermission = fetchConfig("permission");
        cfPermission && middlewares.push(permissionCheck(cfPermission));
        /// 4) inputType
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
                    try {
                        var result = await realfunc({...request, request, response, socket});
                    } catch(reason) {
                        next(reason);
                    }
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
        var ps = { ...params, paging: undefined };
        /// including others
        // for (var p in ps) query = query.equalTo(p, ps[p]);
        function queryFilter(query: Parse.Query<T>, params: object, prefix: string = null) {
        // console.log('prefix', prefix, params);
            if (Array.isArray(params)) return query.containedIn(prefix, params);
            if (params instanceof Parse.Object ||
                params instanceof Parse.User
                ) return query.equalTo(`${prefix}`, params);
            if (typeof params === 'object') {
                for (let key in params) {
                    queryFilter(query, params[key], (prefix ? `${prefix}.` : '') + key);
                }
                return;
            }
            return query.equalTo(prefix, params);

        }
        queryFilter(query, ps);
        return query;
    }

    export async function Pagination<T extends Parse.Object = any>(query: Parse.Query<T>, params: IInputPaging<any>, filter: any = null, tuner: ((input: T[])=> Promise<T[]>) = null): Promise<IOutputPaging<any>> {
        var paging = params.paging || {};
        var page = +(paging.page || 1);
        var pageSize = +(paging.pageSize || 20);
        var all = "true" == paging.all;
        if (all) pageSize = Number.MAX_SAFE_INTEGER;
        var o = await query.limit(pageSize).skip( (page-1) * pageSize ).find();
        var total = await query.count();
        var totalPages = Math.ceil(total / pageSize);

        if (tuner) o = await tuner(o);
        var results = o.map( (data) => ParseObject.toOutputJSON(data, filter) );

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

        var isClass = retrievePrimaryClass(className) ? true : false;

        if ( (!isClass && className[0] === 'I') || isClass ) {
            /// handle interface & class
            CRUDMaker(caller(), className, options, isClass);

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
        private 

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
                    if (res.statusCode !== 200) return reject([res, body]);
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
                    if (res.statusCode !== 200) return reject([res, body]);
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
            
            return new Promise<Socket>( (resolve, reject) => {
                const ws = new WSSocket(this.makeUrl(key as string, true));
                ws.on("open", async () => {
                    ws.on("close", (e) => console.log('close...', e))
                    ws.on("message", (data) => console.log('data', data))
                    resolve( await Socket.get(ws) )
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
            this.C("/users/login", {
                username, password
            } as any)
            .then( () => this.mtxLogin.release() )
            .catch( e => {
                Log.Error(this.constructor.name, `Auto login failed: ${e}`);
                this.mtxLogin.release();
                setTimeout(() => this.doLogin(), 1000);
            });
        }

        async C<
            K extends keyof T["Post"],
            U extends ApisExtractInput<T["Post"][K]>,
            V extends ApisExtractOutput<T["Post"][K]>,
            P extends ApisExtractLoginRequired<T["Post"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'POST' | 'PUT' = 'POST'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                super.C(key, data, spec)
                    .then( resolve )
                    .catch( async (e) => {
                        this.sjRequestLogin.next();
                        await this.sjLogined.filter(v=>v).first().toPromise();
                        reject(e);
                    });
            }, 0, "iSAPServerC");
        }

        async R<
            K extends keyof T["Get"],
            U extends ApisExtractInput<T["Get"][K]>,
            V extends ApisExtractOutput<T["Get"][K]>,
            P extends ApisExtractLoginRequired<T["Get"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'GET' | 'DELETE' = 'GET'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                super.R(key, data, spec)
                    .then( resolve )
                    .catch( async (e) => {
                        this.sjRequestLogin.next();
                        await this.sjLogined.filter(v=>v).first().toPromise();
                        reject(e);
                    });
            }, 0, "iSAPServerC");
        }
    }

}

