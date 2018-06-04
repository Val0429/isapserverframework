import * as Socket from 'ws';

declare module 'helpers/cgi-helpers/core' {
    export interface ActionConfig {
        /**
         * Which path apply to route?
         * Default = *
         */
        path?: string;

        /**
         * How many bytes allowed for the post body?
         */
        postSizeLimit?: number;

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
}