/// <reference path="./core.d.ts" />

/// Express
import * as express from 'express';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router, NextFunction, RequestHandler } from 'express/lib/router/index';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

/// Parse & define
import * as Parse from 'parse/node';
import { RoleList, IRole } from './../../core/userRoles.gen';
//import * as Socket from 'ws';
import { Socket } from './../../helpers/sockets/socket-helper';
import { Errors, IInputPaging, IOutputPaging } from './../../core/errors.gen';
import { Config } from './../../core/config.gen';

/// Middlewares
import * as Middlewares from './../../helpers/middlewares/index';

/// Helpers
export * from './../parse-server/user-helper';
export * from './../parse-server/file-helper';
export * from './../parse-server/parse-helper';
import { omitObject } from './../../helpers/utility/omit-object';
import { ParseObject, ParseObjectJSONRule } from './../../helpers/parse-server/parse-helper';

/// private middlewares
import { VBodyParserJson } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { requiredParameters } from './private-middlewares/required-parameters';
import { inputType } from './private-middlewares/input-type';
var caller = require('caller');

export class Action<T = any, U = any> {
    config: ActionConfig;
    caller: string;

    constructor(config: ActionConfig) {
        this.caller = caller();
        this.config = config;
    }

    _get(type, arg1, arg2 = null) {
        var callback = arg2 || arg1; if (arg2) this[`func${type}Config`] = typeof arg1 === 'string' ? { path: arg1 } : arg1; this[`func${type}`] = <any>callback; return this;
    }

    public funcAllConfig: ActionConfig;
    private funcAll: ActionCallback<T, U>;
    all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

    public funcGetConfig: ActionConfig;
    private funcGet: ActionCallback<T, U>;
    get<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get(arg1, arg2 = null) { return this._get("Get", arg1, arg2); }

    public funcPostConfig: ActionConfig;
    private funcPost: ActionCallback<T, U>;
    post<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post(arg1, arg2 = null) { return this._get("Post", arg1, arg2); }

    public funcPutConfig: ActionConfig;
    private funcPut: ActionCallback<T, U>;
    put<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put(arg1, arg2 = null) { return this._get("Put", arg1, arg2); }

    public funcDeleteConfig: ActionConfig;
    private funcDelete: ActionCallback<T, U>;
    delete<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete(arg1, arg2 = null) { return this._get("Delete", arg1, arg2); }

    public funcWsConfig: ActionConfig;
    private funcWs: ActionCallback<T, U>;
    ws<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws(arg1, arg2 = null) { return this._get("Ws", arg1, arg2); }

    /// translate ActionConfig to array of middlewares
    static configTranslate(config: ActionConfig, caller: string): any[] {
        var middlewares = [];
        if (!config) return middlewares;
        /////////////////////////////////////////////
        /// mount middlewares

        /// 1) bodyParser
        middlewares.push(
            VBodyParserJson( config.postSizeLimit ? { limit: config.postSizeLimit } : null )
        );

        /// 2) login
        config.loginRequired && middlewares.push(loginRequired);
        /// 3) permission
        config.permission && middlewares.push(permissionCheck(config.permission));
        /// 4) requiredParameters
        config.requiredParameters && middlewares.push(requiredParameters(config.requiredParameters));
        /// 4) inputType
        config.inputType && middlewares.push(inputType(caller, config.inputType));
        /// mount others
        config.middlewares && (middlewares = [...middlewares, ...config.middlewares]);
        /////////////////////////////////////////////

        return middlewares;
    }

    mount(): Router {
        var router: Router = express.Router();

        /// mount middlewares
        router.use(Action.configTranslate(this.config, this.caller));

        var funcs = ["All", "Get", "Post", "Put", "Delete"];
        for (var func of funcs) {
            if (this[`func${func}`]) {
                let realfunc = this[`func${func}`];
                let config: ActionConfig = this[`func${func}Config`];
                let realpath = (config ? config.path : "*") || "*";
                router[func.toLowerCase()](realpath, Action.configTranslate(config, this.caller), mergeParams,
                    async (request: Request, response: Response, next: NextFunction) => {
                        try {
                            var result = await realfunc({...request ,request, response});
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
            router["websocket"](realpath, ...Action.configTranslate(config, this.caller), mergeParams,
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

    export interface Query<T> {
        query: Partial<T>;
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

    /**
     * C: prototype
     */
    // static C<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, requiredParameters: string[] = [], options: ActionConfig = {},
    //     tuner?: RestfulTuner<T>
    //     ) {
    //     options = options || {};
    //     options.requiredParameters = requiredParameters;
            
    //     action.post<InputRestfulC<T>, OutputRestfulC<T>>(options, async <U>(data: U): Promise<ParseObject<T>> => {
    //         var params = (<any>data).parameters;
    //         tuner && ( params = await tuner(params) );
    //         var o = new type(omitObject(params, requiredParameters));
    //         await o.save();
    //         return o;
    //     });
    // }

    /**
     * R: prototype
     */
    // static R<T>(action: Action, type: new(...args: any[]) => ParseObject<T>, options: ActionConfig = {},
    //     tuner?: RestfulTuner<ParseObject<T>>
    // ) {
    //     action.get<InputRestfulR<T>, OutputRestfulR<T>>(options, async (data): Promise<OutputRestfulR<T>> => {
    //         var params = (<any>data).parameters;
    //         return await this.SingleOrPagination<ParseObject<T>>( new Parse.Query(type), params, null, tuner );
    //     });
    // }

    /**
     * U: prototype
     */
    // static U<T>(action: Action, type: new(...args: any[]) => ParseObject<T>, acceptParameters: string[] = [], options: ActionConfig = {},
    //     tuner?: RestfulTuner<T>
    // ) {
    //     const key = "objectId";
    //     options = options || {};
    //     options.requiredParameters = (options.requiredParameters || []).concat(key);

    //     action.put<InputRestfulU<T>, OutputRestfulU<T>>(options, async (data): Promise<OutputRestfulU<T>> => {
    //         var params = (<any>data).parameters;
    //         tuner && ( params = await tuner(params) );
            
    //         var o = await new Parse.Query(type)
    //             .get(params.objectId);
    //         await o.save( omitObject(params, acceptParameters) );
    //         return o;
    //     });
    // }

    /**
     * D: prototype
     */
    // static D<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, options: ActionConfig = {},
    //     tuner?: RestfulTuner<T>
    // ) {
    //     const key = "objectId";
    //     options = options || {};
    //     options.requiredParameters = (options.requiredParameters || []).concat(key);

    //     action.delete<InputRestfulD<T>, OutputRestfulD<T>>(options, async (data): Promise<OutputRestfulD<T>> => {
    //         var params = (<any>data).parameters;
    //         tuner && ( params = await tuner(params) );

    //         var o = await new Parse.Query(type)
    //             .get(params.objectId);
    //         await o.destroy();
    //         return o;
    //     });
    // }

    // static CRUD<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, requiredParameters: string[], acceptParameters: string[] = null) {
    //     acceptParameters = acceptParameters || requiredParameters;

    //     this.C<T>(action, type, acceptParameters, {requiredParameters});
    //     this.R<T>(action, type);
    //     this.U<T>(action, type, acceptParameters);
    //     this.D<T>(action, type);
    // }

    // static async Pagination<T extends Parse.Object = any>(query: Parse.Query<T>, paging: IInputPaging,
    //     rules: ParseObjectJSONRule = null, tuner?: RestfulTuner<any>): Promise<IOutputPaging<T[]>> {

    //     var page = +(paging.page || 1);
    //     var pageSize = +(paging.pageSize || 20);
    //     if ("true" === paging.all) pageSize = Number.MAX_SAFE_INTEGER;
    //     var o = await query.limit(pageSize).skip( (page-1) * pageSize ).find();
    //     var total = await query.count();
    //     var totalPages = Math.ceil(total / pageSize);

    //     /// apply tuner
    //     if (tuner) {
    //         for (var u of o) await tuner(u);
    //     }

    //     if (paging.all === "true") return { total, results: ParseObject.toOutputJSON.call(o, rules) };
    //     return { page, pageSize, total, totalPages, results: ParseObject.toOutputJSON.call(o, rules) };
    // }

    export function Filter<T extends Parse.Object = any>(query: Parse.Query<T>, params: object): Parse.Query<T> {
        /// remove paging
        var ps = { ...params, paging: undefined };
        /// including others
        for (var p in ps) query = query.equalTo(p, ps[p]);
        return query;
    }

    export async function Pagination<T extends Parse.Object = any>(query: Parse.Query<T>, params: IInputPaging<any>, filter: any = null): Promise<IOutputPaging<any>> {
        var paging = params.paging || {};
        var page = +(paging.page || 1);
        var pageSize = +(paging.pageSize || 20);
        var all = "true" == paging.all;
        if (all) pageSize = Number.MAX_SAFE_INTEGER;
        var o = await query.limit(pageSize).skip( (page-1) * pageSize ).find();
        var total = await query.count();
        var totalPages = Math.ceil(total / pageSize);

        var results = o.map( (data) => ParseObject.toOutputJSON(data, filter) );

        if (all) return { paging: {total}, results };
        return { paging: {page, pageSize, total, totalPages}, results };
    }

    // static async SingleOrPagination<T extends Parse.Object = any>(query: Parse.Query<T>, paging: IInputPaging & { objectId?: string },
    //     rules: ParseObjectJSONRule = null, tuner?: RestfulTuner<any>): Promise<IOutputPaging<T[]> | T> {
    //     /// single
    //     if (paging.objectId) {
    //         var o = await query.get(paging.objectId);
    //         tuner && await tuner(o);
    //         return ParseObject.toOutputJSON.call(o, rules);
    //     }
    //     return this.Pagination(query, paging, rules, tuner);
    // }

}
