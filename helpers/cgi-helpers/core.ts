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
import { Errors } from './../../core/errors.gen';

/// Middlewares
import * as Middlewares from './../../helpers/middlewares/index';

/// Helpers
export * from './../parse-server/user-helper';
export * from './../parse-server/file-helper';
import * as prune from 'json-prune';

/// private middlewares
import { VBodyParserJson } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';
import { requiredParameters } from './private-middlewares/required-parameters';

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
            router["websocket"](realpath, Action.configTranslate(config), mergeParams,
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
