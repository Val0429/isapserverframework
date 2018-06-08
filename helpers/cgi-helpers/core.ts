/// <reference path="./core.d.ts" />

/// Express
import * as express from 'express';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router, RequestHandler } from 'express/lib/router/index';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

/// Parse & define
import * as Parse from 'parse/node';
import { RoleList, IRole } from './../../core/userRoles.gen';
import * as Socket from 'ws';
import { Errors, IInputPaging, IOutputPaging } from './../../core/errors.gen';

/// Middlewares
import * as Middlewares from './../../helpers/middlewares/index';

/// Helpers
export * from './../parse-server/user-helper';
export * from './../parse-server/file-helper';
export * from './../parse-server/parse-helper';
import { omitObject } from './../../helpers/utility/omit-object';
import { ParseObject } from './../../helpers/parse-server/parse-helper';

/// private middlewares
import { VBodyParserJson } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { requiredParameters } from './private-middlewares/required-parameters';
import { accessControlAllowOrigin } from './private-middlewares/access-control-allow-origin';

export class Action<T = any, U = any> {
    config: ActionConfig;

    constructor(config: ActionConfig) {
        this.config = config;
    }

    _get(type, arg1, arg2 = null) {
        var callback = arg2 || arg1; if (arg2) this[`func${type}Config`] = typeof arg1 === 'string' ? { path: arg1 } : arg1; this[`func${type}`] = <any>callback; return this;
    }

    private funcAllConfig: ActionConfig;
    private funcAll: ActionCallback<T, U>;
    all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

    private funcGetConfig: ActionConfig;
    private funcGet: ActionCallback<T, U>;
    get<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get(arg1, arg2 = null) { return this._get("Get", arg1, arg2); }

    private funcPostConfig: ActionConfig;
    private funcPost: ActionCallback<T, U>;
    post<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post(arg1, arg2 = null) { return this._get("Post", arg1, arg2); }

    private funcPutConfig: ActionConfig;
    private funcPut: ActionCallback<T, U>;
    put<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put(arg1, arg2 = null) { return this._get("Put", arg1, arg2); }

    private funcDeleteConfig: ActionConfig;
    private funcDelete: ActionCallback<T, U>;
    delete<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete(arg1, arg2 = null) { return this._get("Delete", arg1, arg2); }

    private funcWsConfig: ActionConfig;
    private funcWs: ActionCallback<T, U>;
    ws<K = null, V = null>(path: string | ActionConfig, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws(arg1, arg2 = null) { return this._get("Ws", arg1, arg2); }

    /// translate ActionConfig to array of middlewares
    static configTranslate(config: ActionConfig): any[] {
        var middlewares = [];
        if (!config) return middlewares;
        /////////////////////////////////////////////
        /// mount middlewares
        /// todo
        middlewares.push(accessControlAllowOrigin);

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
        /// mount others
        config.middlewares && (middlewares = [...middlewares, ...config.middlewares]);
        /////////////////////////////////////////////

        return middlewares;        
    }

    mount(): Router {
        var router: Router = express.Router();

        /// mount middlewares
        router.use(Action.configTranslate(this.config));

        var funcs = ["All", "Get", "Post", "Put", "Delete"];
        for (var func of funcs) {
            if (this[`func${func}`]) {
                let realfunc = this[`func${func}`];
                let config: ActionConfig = this[`func${func}Config`];
                let realpath = (config ? config.path : "*") || "*";
                router[func.toLowerCase()](realpath, Action.configTranslate(config), mergeParams,
                    async (request: Request, response: Response) => {
                        try {
                            var result = await realfunc({...request, request, response});
                            response.send(result);
                            
                        } catch(reason) {
                            if (reason instanceof Errors) reason.resolve(response);
                            else {
                                Errors.throw(Errors.Custom, [reason.toString()]).resolve(response);
                            }
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
            router["websocket"](realpath, ...Action.configTranslate(config), mergeParams,
                (info: ExpressWsRouteInfo, cb: ExpressWsCb) => {
                    cb( async (socket: Socket) => {
                        var request = <any>info.req;
                        var response = <any>info.res;
                        try {
                            var result = await realfunc({...request, request, response});
                            socket.send(JSON.stringify(result));
                        } catch(reason) {
                            if (reason instanceof Errors) reason.resolve(response);
                            else {
                                socket.send(JSON.stringify(result));
                            }
                        }
                    });
                }
            );
        }
        return router;
    }
}

export type InputRestfulC<T = {}> = {
    sessionId: string;
} & T;
export type OutputRestfulC<T = {}> = ParseObject<T>;

export interface InputRestfulR<T = {}> extends IInputPaging {
    sessionId: string;
    objectId?: string;
}
export type OutputRestfulR<T> = IOutputPaging<ParseObject<T>[]> | ParseObject<T>;

export type InputRestfulU<T = {}> = {
    sessionId: string;
    objectId: string;
} & T;
type OutputRestfulU<T> = ParseObject<T>;

export type InputRestfulD<T> = {
    sessionId: string;
    objectId: string;
} & T;
export type OutputRestfulD<T = {}> = ParseObject<T>;

export class Restful {
    /**
     * C: prototype
     */
    // action.post<InputPost>({
    //     requiredParameters: ["floor", "phone", "unitNo"],
    // }, async (data) => {
    //     var floor = new Floors({
    //         floor: data.parameters.floor,
    //         phone: data.parameters.phone,
    //         unitNo: data.parameters.unitNo,
    //     });
    //     await floor.save();

    //     return floor;

    // });

    // action.post<InputPost, OutputPost>({
    //     requiredParameters: ["floor", "phone", "unitNo"],
    // }, RestfulC(Floors, ["floor", "phone", "unitNo"]));

    // function RestfulC<T extends Parse.Object>(type: new(...args: any[])=> T, keys: string[]) {
    //     return async <U>(data: U): Promise<T> => {
    //         var o = new type(omitObject((<any>data).parameters, keys));
    //         await o.save();
    //         return o;
    //     }
    // }

    static C<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, acceptParameters: string[] = [], options: ActionConfig = {}) {
        action.post<InputRestfulC<T>, OutputRestfulC<T>>(options, async <U>(data: U): Promise<ParseObject<T>> => {
            var o = new type(omitObject((<any>data).parameters, acceptParameters));
            await o.save();
            return o;
        });
    }

    /**
     * R: prototype
     */
    // action.get<InputGet, OutputGet>(async (data) => {
    //     var page = +(data.parameters.page || 1);
    //     var pageSize = +(data.parameters.pageSize || 20);

    //     var floors = await new Parse.Query(Floors)
    //         .limit(pageSize)
    //         .skip( (page-1) * pageSize )
    //         .find();

    //     var total = await new Parse.Query(Floors).count();
    //     var totalPages = Math.ceil(total / pageSize);

    //     return {
    //         page, pageSize,
    //         total, totalPages,
    //         results: floors
    //     }
    // });
    // static R<T extends Parse.Object>(type: new(...args: any[])=> T) {
    //     return async <U>(data: U): Promise<IOutputPaging<T[]>> => {
    //         var param = (<any>data).parameters;
    //         var page = +(param.page || 1);
    //         var pageSize = +(param.pageSize || 20);
    //         var o = await new Parse.Query(type)
    //             .limit(pageSize)
    //             .skip( (page-1) * pageSize )
    //             .find();
    //         var total = await new Parse.Query(type).count();
    //         var totalPages = Math.ceil(total / pageSize);
    //         return {
    //             page, pageSize,
    //             total, totalPages,
    //             results: o
    //         }
    //     }
    // }

    static R<T>(action: Action, type: new(...args: any[]) => ParseObject<T>, options: ActionConfig = {}) {
        action.get<InputRestfulR<T>, OutputRestfulR<T>>(options, async (data): Promise<OutputRestfulR<T>> => {
            return await this.SingleOrPagination<ParseObject<T>>( new Parse.Query(type), data.parameters );
        });
    }

    /**
     * U: prototype
     */
    // action.put<InputPut, OutputPut>({
    //     requiredParameters: ["objectId"],
    // }, async (data) => {
    //     var floor = await new Parse.Query(Floors)
    //         .get(data.parameters.objectId);

    //     await floor.save( omitObject(data.parameters, ["floor", "phone", "unitNo"]) );
    //     return floor;
    // });
    // action.put<InputPut, OutputPut>({
    //     requiredParameters: ["objectId"],
    // }, RestfulU(Floors, ["floor", "phone", "unitNo"]));

    // function RestfulU<T extends Parse.Object>(type: new(...args: any[])=> T, keys: string[]) {
    //     return async <U>(data: U): Promise<T> => {
    //         var param = (<any>data).parameters;
    //         var o = await new Parse.Query(type)
    //             .get(param.objectId);
    //         await o.save( omitObject(param, keys) );
    //         return o;
    //     }
    // }

    static U<T>(action: Action, type: new(...args: any[]) => ParseObject<T>, acceptParameters: string[] = [], options: ActionConfig = {}) {
        const key = "objectId";
        options.requiredParameters = (options.requiredParameters || []).concat(key);

        action.put<InputRestfulU<T>, OutputRestfulU<T>>(options, async (data): Promise<OutputRestfulU<T>> => {
            var param = (<any>data).parameters;
            var o = await new Parse.Query(type)
                .get(param.objectId);
            await o.save( omitObject(param, acceptParameters) );
            return o;
        });
    }

    /**
     * D: prototype
     */
    // action.delete<InputDelete>({
    //     requiredParameters: ["objectId"],
    // }, async (data) => {
    //     var floor = await new Parse.Query(Floors)
    //         .get(data.parameters.objectId);
    //     await floor.destroy();

    //     return;
    // });
    // action.delete<InputDelete, OutputDelete>({
    //     requiredParameters: ["objectId"],
    // }, RestfulD(Floors));

    // function RestfulD<T extends Parse.Object>(type: new(...args: any[])=> T) {
    //     return async <U>(data: U): Promise<T> => {
    //         var param = (<any>data).parameters;
    //         var o = await new Parse.Query(type)
    //             .get(param.objectId);
    //         await o.destroy();
    //         return o;
    //     }
    // }

    static D<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, options: ActionConfig = {}) {
        const key = "objectId";
        options.requiredParameters = (options.requiredParameters || []).concat(key);

        action.delete<InputRestfulD<T>, OutputRestfulD<T>>(options, async (data): Promise<OutputRestfulD<T>> => {
            var param = (<any>data).parameters;
            var o = await new Parse.Query(type)
                .get(param.objectId);
            await o.destroy();
            return o;
        });
    }

    static CRUD<T>(action: Action, type: new(...args: any[])=> ParseObject<T>, requiredParameters: string[], acceptParameters: string[] = null) {
        acceptParameters = acceptParameters || requiredParameters;

        this.C<T>(action, type, acceptParameters, {requiredParameters});
        this.R<T>(action, type);
        this.U<T>(action, type, acceptParameters);
        this.D<T>(action, type);
    }

            // /// multiple
            // var param = (<any>data).parameters;
            // var page = +(param.page || 1);
            // var pageSize = +(param.pageSize || 20);
            // var o = await new Parse.Query(type)
            //     .limit(pageSize)
            //     .skip( (page-1) * pageSize )
            //     .find();
            // var total = await new Parse.Query(type).count();
            // var totalPages = Math.ceil(total / pageSize);
            // return {
            //     page, pageSize,
            //     total, totalPages,
            //     results: o
            // }

    static async Pagination<T extends Parse.Object = any>(query: Parse.Query<T>, paging: IInputPaging,
        postScript: (obj: T) => Promise<void> = null): Promise<IOutputPaging<T[]>> {

        var page = +(paging.page || 1);
        var pageSize = +(paging.pageSize || 20);
        if ("true" === paging.all) pageSize = Number.MAX_SAFE_INTEGER;
        var o = await query.limit(pageSize).skip( (page-1) * pageSize ).find();
        var total = await query.count();
        var totalPages = Math.ceil(total / pageSize);

        if (postScript) {
            for (var i of o) await postScript(<any>i);
        }

        if (paging.all === "true") return { total, results: o };
        return { page, pageSize, total, totalPages, results: o };
    }

    static async SingleOrPagination<T extends Parse.Object = any>(query: Parse.Query<T>, paging: IInputPaging & { objectId?: string },
        postScript: (obj: T) => Promise<void> = null): Promise<IOutputPaging<T[]> | T> {
        /// single
        if (paging.objectId) {
            var o = await query.get(paging.objectId);
            if (postScript) {
                await postScript(o);
            }
            return o;
        }
        return this.Pagination(query, paging, postScript);
    }
}

    

// import config from './../../workspace/config/default/core';

// /// loginRequired //////////////////////////////////////////
// declare module "helpers/cgi-helpers/core" {
//     export interface ActionParam<T> {
//         session: Parse.Session;
//         user: Parse.User;
//         role: Parse.Role;
//     }
// }

// declare module 'express/lib/request' {
//     interface Request {
//         session: Parse.Session;
//         user: Parse.User;
//         role: Parse.Role;
//     }
// }
// export async function loginRequired(req: Request, res: Response, next: NextFunction) {
//     var sessionKey: string = config.keyOfSessionId;

//     /// should contain sessionId
//     var sessionId: string = req.parameters[sessionKey];
//     if (!sessionId) {
//         return Errors.throw(Errors.ParametersRequired, [sessionKey]).resolve(res);
//     }

//     var session: Parse.Session;
//     var user: Parse.User;
//     var role: Parse.Role;
//     try {
//         /// get session instance
//         session = await new Parse.Query("_Session")
//                 .descending("createdAt")
//                 .include("user")
//                 .first({sessionToken: sessionId}) as Parse.Session;
            
//         /// session not match
//         if (!session || session.getSessionToken() != sessionId) {
//             return Errors.throw(Errors.LoginRequired).resolve(res);
//         }

//         /// get user instance
//         user = session.get("user");

//         /// get user role
//         role = await new Parse.Query(Parse.Role)
//                 .equalTo("users", user)
//                 .first() as Parse.Role;

//     } catch(reason) {
//         return Errors.throw(Errors.SessionNotExists).resolve(res);
//     }

//     /// final
//     req.session = session;
//     req.user = user;
//     req.role = role;
//     next();
// }
// ////////////////////////////////////////////////////////////


// import { NextFunction } from 'express/lib/router/index';
// /// permissionCheck ////////////////////////////////////////
// export function permissionCheck(permissions: RoleList[]): RequestHandler {
//     return <any>((req: Request, res: Response, next: NextFunction) => {
//         if (permissions.indexOf(<RoleList>req.role.get("name")) < 0) {
//             return Errors.throw(Errors.PermissionDenined).resolve(res);
//         }
//         next();
//     });
// }
// ////////////////////////////////////////////////////////////


// import { bodyParser } from './../middlewares/body-parser';
// /// BodyParser --> + parameters ////////////////////////////
// declare module 'helpers/cgi-helpers/core' {
//     export interface ActionParam<T> {
//         parameters: T;
//     }
// }
// declare module 'express/lib/request' {
//     interface Request {
//         parameters: any;
//     }
// }

// export function VBodyParserJson(options = null): RequestHandler {
//     return <any>((req: Request, res: Response, next: NextFunction): any => {
//         return bodyParser.json(options)(req, res, () => {
//             req.parameters = { ...req.query, ...req.body };
//             next();
//         });
//     })
// }

// ////////////////////////////////////////////////////////////
