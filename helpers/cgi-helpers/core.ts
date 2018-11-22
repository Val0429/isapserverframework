/// Express
import * as express from 'express';
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
import { O, _O } from 'helpers/utility/O';
var caller = require('caller');

/// private middlewares
import { VBodyParserJson, VBodyParserRaw } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { inputType } from './private-middlewares/input-type';
import { transform } from './private-middlewares/transform';


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


export class Action<T = any, U = any> {
    config: ActionConfig;
    caller: string;

    constructor(config: ActionConfig<T, U>) {
        this.caller = caller();
        this.config = config;
    }

    _get(type, arg1, arg2 = null) {
        var callback = arg2 || arg1; if (arg2) this[`func${type}Config`] = typeof arg1 === 'string' ? { path: arg1 } : arg1; this[`func${type}`] = <any>callback; return this;
    }

    /**
     * count number of apis
     */
    count(): number {
        let count = 0;
        let data = ["All", "Get", "Post", "Put", "Delete", "Ws"];
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

}

