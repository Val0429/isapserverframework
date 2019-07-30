/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as expressWsRoutes from 'express-ws-routes';
import { Request } from 'express/lib/request';
import { Response } from 'express/lib/response';

export interface ExpressWsRouteInfo {
    origin: string;
    secure: boolean;
    req: Request;
    res: Response;
}

import * as Socket from 'ws';

export interface ExpressWsCb {
    (callback: {(socket: Socket): void | Promise<void>}): void;
    (pass: false, statusCode: number, message: string): void;
}

export interface ExpressWsSocket {
    info: ExpressWsRouteInfo;
    cb: ExpressWsCb;
}

// import '~express/lib/router/index';
// declare module '~express/lib/router/index' {
//     namespace createRouter {
//         export interface Router {
//             websocket(path: PathArgument, callback: ExpressWsCb);
//         }
//     }
// }

export { expressWsRoutes };