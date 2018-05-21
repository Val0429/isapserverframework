/// Express
import * as express from 'express';
export { express };
import { Request } from 'express/lib/request';
export { Request };
import { Response } from 'express/lib/response';
export { Response };
import { Router } from 'express/lib/router/index';
export { Router };

/// Parse & define
import * as Parse from 'parse/node';
export { Parse };
export * from './userRoles.gen';
import { RoleList, IRole } from './userRoles.gen';
export * from './events.gen';
export * from './errors.gen';
import { Errors } from './errors.gen';

/// Middlewares
import * as Middlewares from './../helpers/middlewares/index';
export * from './../helpers/middlewares/index';


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
        var param = {
            params: null,
            request: null,
            response: null,
            role: null,
            user: null,
            ws: null,
        }

        /////////////////////////////////////////////
        /// mount middlewares
        /// 1) bodyParser
        router.use(Middlewares.bodyParserJson);
        /// 2) login
        /// 3) permission
        /// mount others
        for (var middleware of this.config.middlewares) router.use(middleware);
        /////////////////////////////////////////////

        var funcs = ["All", "Get", "Post", "Put", "Delete"];
        for (var func of funcs) {
            if (this[`func${func}`]) {
                router[func.toLowerCase()]("*", async (request: Request, response: Response) => {
                    var result = await this[`func${func}`]({...param, request, response});
                    if (result instanceof Errors) {
                        response.status(result.detail.statusCode)
                                .end(result.resolve());
                    } else {
                        result.end(JSON.stringify(result));
                    }
                });
            }
        }
        /// ws
        if (this.funcWs) {
            router["ws"]("*", async (ws, request) => {
                var result = await this.funcWs({...param, ws, request});
                if (result instanceof Errors) {
                    ws.send(JSON.stringify(result.resolve()));
                    /// todo: ws end?
                } else {
                    ws.send(JSON.stringify(result));
                }
            });
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
    user: Parse.User;
    role: IRole;
    params: T;

    ws: WebSocket;
    request: Request;
    response: Response;
}