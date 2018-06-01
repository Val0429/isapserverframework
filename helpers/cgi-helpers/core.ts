/// <reference path="./core.define.ts" />

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

/// private middlewares
import { VBodyParserJson } from './private-middlewares/v-body-parser-json';
import { permissionCheck } from './private-middlewares/permission-check';
import { loginRequired } from './private-middlewares/login-required';
import { mergeParams } from './private-middlewares/merge-params';

export class Action<T = any, U = any> {
    config: ActionConfig;

    constructor(config: ActionConfig) {
        this.config = config;
    }

    private funcAllPath: string;
    private funcAll: ActionCallback<T, U>;
    all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

    private funcGetPath: string;
    private funcGet: ActionCallback<T, U>;
    get<K = null, V = null>(path: string, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    get(arg1, arg2 = null) { const type = "Get"; var callback = arg2 || arg1; if (arg2) this[`func${type}Path`] = arg1; this[`func${type}`] = <any>callback; return this; }

    private funcPostPath: string;
    private funcPost: ActionCallback<T, U>;
    post<K = null, V = null>(path: string, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    post(arg1, arg2 = null) { const type = "Post"; var callback = arg2 || arg1; if (arg2) this[`func${type}Path`] = arg1; this[`func${type}`] = <any>callback; return this; }

    private funcPutPath: string;
    private funcPut: ActionCallback<T, U>;
    put<K = null, V = null>(path: string, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    put(arg1, arg2 = null) { const type = "Put"; var callback = arg2 || arg1; if (arg2) this[`func${type}Path`] = arg1; this[`func${type}`] = <any>callback; return this; }

    private funcDeletePath: string;
    private funcDelete: ActionCallback<T, U>;
    delete<K = null, V = null>(path: string, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    delete(arg1, arg2 = null) { const type = "Delete"; var callback = arg2 || arg1; if (arg2) this[`func${type}Path`] = arg1; this[`func${type}`] = <any>callback; return this; }

    private funcWsPath: string;
    private funcWs: ActionCallback<T, U>;
    ws<K = null, V = null>(path: string, callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws<K = null, V = null>(callback: ActionCallback<K extends null ? T : K, V extends null ? U : V>): Action<T, U>;
    ws(arg1, arg2 = null) { const type = "Ws"; var callback = arg2 || arg1; if (arg2) this[`func${type}Path`] = arg1; this[`func${type}`] = <any>callback; return this; }

    mount(): Router {
        var router: Router = express.Router();

        /////////////////////////////////////////////
        /// mount middlewares
        /// 1) bodyParser
        router.use(VBodyParserJson(
            this.config.postSizeLimit ? { limit: this.config.postSizeLimit } : null
        ));
        /// 2) login
        if (this.config.loginRequired) router.use(loginRequired);
        /// 3) permission
        if (this.config.permission) router.use(permissionCheck(this.config.permission));
        /// mount others
        if (this.config.middlewares) for (var middleware of this.config.middlewares) router.use(middleware);
        /////////////////////////////////////////////

        var funcs = ["All", "Get", "Post", "Put", "Delete"];
        for (var func of funcs) {
            if (this[`func${func}`]) {
                let realfunc = this[`func${func}`];
                let realpath = this[`func${func}Path`] || "*";
                router[func.toLowerCase()](realpath, mergeParams, async (request: Request, response: Response) => {
                    // var result = await realfunc({...request, request, response});
                    // if (result instanceof Errors) {
                    //     result.resolve(response);
                    // } else {
                    //     response.send(result);
                    // }
                    try {
                        var result = await realfunc({...request, request, response});
                        response.send(result);
                    } catch(reason) {
                        if (reason instanceof Errors) reason.resolve(response);
                        else {
                            Errors.throw(Errors.Custom, [reason.toString()]).resolve(response);
                        }
                    }
                });
            }
        }
        /// ws
        if (this.funcWs) {
            let realfunc = this.funcWs;
            let realpath = this.funcWsPath || "*";
            router["websocket"](realpath, mergeParams, (info: ExpressWsRouteInfo, cb: ExpressWsCb) => {
                cb( async (socket: Socket) => {
                    var request = <any>info.req;
                    var response = <any>info.res;
                    // var result = await realfunc({...request, socket, request, response});
                    // if (result instanceof Errors) {
                    //     result.resolve(response);
                    // } else {
                    //     socket.send(JSON.stringify(result));
                    // }
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
            });

            // console.log('who?', 'got');
            // router["ws"]("*", async (ws, request) => {
            //     console.log('got??');
            //     ws.send('gotgotecho');
            //     var result = await this.funcWs({...request, ws, request});
            //     if (result instanceof Errors) {
            //         ws.send(JSON.stringify(result.resolve()));
            //         /// todo: ws end?
            //     } else {
            //         ws.send(JSON.stringify(result));
            //     }
            // });
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
