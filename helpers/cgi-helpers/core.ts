/// Express
import * as express from 'express';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';
import { Router } from 'express/lib/router/index';
import * as Socket from 'ws';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

/// Parse & define
import * as Parse from 'parse/node';
import { RoleList, IRole } from './../../core/userRoles.gen';
import { Errors } from './../../core/errors.gen';
import { config } from './../../core/config.gen';

/// Middlewares
import * as Middlewares from './../../helpers/middlewares/index';


export class Action<T = any, U = any> {
    config: ActionConfig;

    constructor(config: ActionConfig) {
        this.config = config;
    }

    funcAll: ActionCallback<T, U>;
    all(callback: ActionCallback<T, U>): Action<T, U> { this.funcAll = callback; return this; }

    funcGet: ActionCallback<T, U>;
    get(callback: ActionCallback<T, U>): Action<T, U> { this.funcGet = callback; return this; }

    funcPost: ActionCallback<T, U>;
    post(callback: ActionCallback<T, U>): Action<T, U> { this.funcPost = callback; return this; }

    funcPut: ActionCallback<T, U>;
    put(callback: ActionCallback<T, U>): Action<T, U> { this.funcPut = callback; return this; }

    funcDelete: ActionCallback<T, U>;
    delete(callback: ActionCallback<T, U>): Action<T, U> { this.funcDelete = callback; return this; }

    funcWs: ActionCallback<T, U>;
    ws(callback: ActionCallback<T, U>): Action<T, U> { this.funcWs = callback; return this; }

    mount(): Router {
        var router: Router = express.Router();

        /////////////////////////////////////////////
        /// mount middlewares
        /// 1) bodyParser
        //router.use(Middlewares.bodyParserJson);
        router.use(VBodyParserJson);
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
                router[func.toLowerCase()]("*", async (request: Request, response: Response) => {
                    var result = await realfunc({...request, request, response});
                    if (result instanceof Errors) {
                        result.resolve(response);
                        // response.status(result.detail.statusCode)
                        //         .end(result.resolve());
                    } else {
                        response.end(JSON.stringify(result));
                    }
                });
            }
        }
        /// ws
        if (this.funcWs) {
            let realfunc = this.funcWs;
            router["websocket"]("*", (info: ExpressWsRouteInfo, cb: ExpressWsCb) => {
                cb( async (socket: Socket) => {
                    var request = <any>info.req;
                    var response = <any>info.res;
                    var result = await realfunc({...request, socket, request, response});
                    if (result instanceof Errors) {
                        result.resolve(response);
                    } else {
                        socket.send(JSON.stringify(result));
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

export interface ActionConfig {
    /**
     * Is this action require login?
     * Default = true.
     */
    loginRequired?: boolean;

    /**
     * Is this action limit to specific role?
     * Default = none.
     */
    permission?: RoleList[];

    /**
     * Which middlewares should be injected into route?
     * Default = none.
     */
    middlewares?: any[];
}

export interface ActionCallback<T, U> {
    (data: ActionParam<T>): (U | Errors) | (Promise<U | Errors>);
}

export interface ActionParam<T> {
    socket: Socket;
    request: Request;
    response: Response;
}

/// Innate Middlewares
/// BodyParser --> + parameters ////////////////////////////
export interface ActionParam<T> {
    parameters: T;
}
declare module 'express/lib/request' {
    interface Request {
        parameters: any;
    }
}
function VBodyParserJson(req: Request, res: Response, next) {
    return Middlewares.bodyParserJson(req, res, () => {
        req.parameters = { ...req.query, ...req.body };
        next();
    });
}
////////////////////////////////////////////////////////////

/// permissionCheck ////////////////////////////////////////
export function permissionCheck(permissions: RoleList[]) {
    return (req: Request, res, next) => {
        if (permissions.indexOf(<RoleList>req.role.name) < 0) {
            return Errors.throw(Errors.PermissionDenined).resolve(res);
        }
        next();
    }
}
////////////////////////////////////////////////////////////

/// loginRequired //////////////////////////////////////////
export interface ActionParam<T> {
    session: Parse.Session;
    user: Parse.User;
    role: IRole;
}
declare module 'express/lib/request' {
    interface Request {
        session: Parse.Session;
        user: Parse.User;
        role: IRole;
    }
}
export async function loginRequired(req: Request, res: Response, next) {
    var sessionKey: string = config.server.keyOfSessionId;

    /// should contain sessionId
    var sessionId: string = req.parameters[sessionKey];
    if (!sessionId) {
        return Errors.throw(Errors.ParametersRequired, [sessionKey]).resolve(res);
    }

    var session: Parse.Session;
    var user: Parse.User;
    var role: Parse.Role;
    try {
        /// get session instance
        session = await new Parse.Query("_Session")
                .descending("createdAt")
                .include("user")
                .first({sessionToken: sessionId}) as Parse.Session;
            
        /// session not match
        if (!session || session.getSessionToken() != sessionId) {
            return Errors.throw(Errors.LoginRequired).resolve(res);
        }

        /// get user instance
        user = session.get("user");

        /// get user role
        role = await new Parse.Query(Parse.Role)
                .equalTo("users", user)
                .first() as Parse.Role;

    } catch(reason) {
        return Errors.throw(Errors.SessionNotExists).resolve(res);
    }

    /// final
    req.session = session;
    req.user = user.attributes;
    req.role = { name: role.get("name") };
    next();
}
////////////////////////////////////////////////////////////