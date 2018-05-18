/// Express
import * as express from 'express';
export { express };
export { Request } from 'express/lib/request';
export { Response } from 'express/lib/response';
export { Router } from 'express/lib/router/index';

/// Parse & define
import * as Parse from 'parse/node';
export { Parse };
export * from './userRoles.gen';
import { RoleList, IRole } from './userRoles.gen';
export * from './events.gen';
export * from './errors.gen';

/// Middlewares
export * from './../helpers/middlewares/index';


export class Action<T, U> {
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
}

export interface ActionCallback<T, U> {
    (data: ActionParam<T>): U | Error;
}

export interface ActionParam<T> {
    user: Parse.User;
    role: IRole;
    params: T;

    ws: WebSocket;
    request: Request;
    response: Response;
}