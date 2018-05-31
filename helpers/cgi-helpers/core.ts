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
                router[func.toLowerCase()]("*", async (request: Request, response: Response) => {
                    var result = await realfunc({...request, request, response});
                    if (result instanceof Errors) {
                        result.resolve(response);
                    } else {
                        response.send(result);
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

