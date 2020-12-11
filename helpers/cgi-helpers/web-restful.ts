/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as Rx from 'rxjs/Rx';
import { BehaviorSubject, Subject } from 'rxjs';

const request = require('request');
const WSSocket = require('isomorphic-ws');

type ParseObject<T> = string;
type IncomingMessage = any;

export interface IInputPagingBase {
    page?: number;
    pageSize?: number;
    all?: "true" | "false";
}

export type IInputPaging<T> = {
    paging?: IInputPagingBase;
} & T;

export interface IOutputPagingBase {
    total: number;
    totalPages?: number;
}

export type IOutputPaging<T> = {
    paging?: IInputPagingBase & IOutputPagingBase
} & {
    results: T[];
}

export namespace Restful {

    export interface Option {
        paging?: boolean;
        parseObject?: boolean;
    }

    export interface ValidObject {
        objectId: string;
    }

    export type InputC<T> = T;
    export type OutputC<T, K extends Option = {
        parseObject: true
    }, U = K extends { parseObject: false } ? ValidObject & T : ParseObject<T> >
         = U;

    export type InputR<T, K extends Option = {
        paging: true
    }, U = K extends { paging: false } ? Partial<T> : IInputPaging<Partial<T>> >
       = U & Partial<ValidObject>;
    export type OutputR<T, K extends Option = {
        paging: true,
        parseObject: true,
    }, U = K extends { parseObject: false } ? ValidObject & T : ParseObject<T>,
       V = K extends { paging: false } ? U : IOutputPaging<U> >
       = V;

    export type InputU<T> = ValidObject & Partial<T>;
    export type OutputU<T, K extends Option = {
        parseObject: true
    }, U = K extends { parseObject: false } ? ValidObject & T : ParseObject<T> >
         = U;

    export type InputD<T> = InputU<T>;
    export type OutputD<T, K extends Option = {
        parseObject: true
    }> = OutputU<T, K>;

    /// Server
    export type ApisType = 'All' | 'Get' | 'Post' | 'Put' | 'Delete' | 'Ws';

    /// Server Implement
    export interface ApisRequestArg {
        [path: string]: [any, any, boolean];
    }
    export type ApisRequestBase = {
        [K in ApisType]?: ApisRequestArg;
    }

    type ApisExtractInput<T> = T extends [infer K, infer U, infer V] ? K : never;
    type ApisExtractOutput<T> = T extends [infer K, infer U, infer V] ? U : never;
    type ApisExtractLoginRequired<T> = T extends [infer K, infer U, infer V] ? V : never;
    type ApisSessionRequired = { sessionId: string };

    interface IiSAPServerBaseConfig {
        ip: string;
        port: number;
    }
    export interface IGeneralRequestError {
        errno: string;
        code: string;
        syscall: string;
        hostname: string;
        host: string;
        port: string;
    }
    
    export interface IGeneralRequestRejection {
        err: IGeneralRequestError;
        res: IncomingMessage;
        body: any;
    }
    
    export class iSAPServerBase<T extends ApisRequestBase, W extends IiSAPServerBaseConfig = IiSAPServerBaseConfig> {
        protected config: W;
        protected sessionId: string = null;
        protected sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
        constructor(config: W) {
            this.config = config;
        }

        private makeUrl(uri: string, ws: boolean = false): string {
            return `${ws ? 'ws' : 'http'}://${this.config.ip}:${this.config.port}${uri}`;
        }

        async C<
            K extends keyof T["Post"],
            U extends ApisExtractInput<T["Post"][K]>,
            V extends ApisExtractOutput<T["Post"][K]>,
            P extends ApisExtractLoginRequired<T["Post"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'POST' | 'PUT' = 'POST'): Promise<V> {

            if (!data) data = {} as any;
            /// apply sessionId
            this.sessionId && (data.sessionId = this.sessionId);

            return new Promise<V>( (resolve, reject) => {
                request({
                    url: this.makeUrl(key as string),
                    method: spec,
                    json: true,
                    body: data
                }, (err, res, body) => {
                    if (err) return reject({err});
                    if (res.statusCode !== 200) return reject({res, body});
                    /// handle sessionId
                    if (body.sessionId && /login/.test(key as string)) {
                        this.sessionId = body.sessionId;
                        this.sjLogined.next(true);
                    }
                    resolve(body);
                });
            });
        
        }

        async R<
            K extends keyof T["Get"],
            U extends ApisExtractInput<T["Get"][K]>,
            V extends ApisExtractOutput<T["Get"][K]>,
            P extends ApisExtractLoginRequired<T["Get"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'GET' | 'DELETE' = 'GET'): Promise<V> {

            if (!data) data = {} as any;
            /// apply sessionId
            this.sessionId && (data.sessionId = this.sessionId);

            /// todo: stringify data
            let params = Object.keys(data).map( (k) => `${k}=${data[k]}` ).join("&");

            return new Promise<V>( (resolve, reject) => {
                request({
                    url: `${this.makeUrl(key as string)}?${params}`,
                    method: spec,
                    json: true,
                }, (err, res, body) => {
                    if (err) return reject({err});
                    if (res.statusCode !== 200) return reject({res, body});
                    /// handle sessionId
                    if (body.sessionId && /login/.test(key as string)) {
                        this.sessionId = body.sessionId;
                        this.sjLogined.next(true);
                    }
                    resolve(body);
                });
            });
                    
        }

        async U<
            K extends keyof T["Put"],
            U extends ApisExtractInput<T["Put"][K]>,
            V extends ApisExtractOutput<T["Put"][K]>,
            P extends ApisExtractLoginRequired<T["Put"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data: U): Promise<V> {
            
            return this.C(key, data, 'PUT');
        }

        async D<
            K extends keyof T["Delete"],
            U extends ApisExtractInput<T["Delete"][K]>,
            V extends ApisExtractOutput<T["Delete"][K]>,
            P extends ApisExtractLoginRequired<T["Delete"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data: U): Promise<V> {
            
            return this.R(key, data, 'DELETE');
        }

        async WS<
            K extends keyof T["Ws"],
            U extends ApisExtractInput<T["Ws"][K]>,
            V extends ApisExtractOutput<T["Ws"][K]>,
            P extends ApisExtractLoginRequired<T["Ws"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K): Promise<Socket> {
            
            // return new Promise<Socket>( (resolve, reject) => {
            //     const url = `${this.makeUrl(key as string, true)}?sessionId=${this.sessionId}`;
            //     const ws = new WSSocket(url);
            //     ws.on("open", async () => {
            //         resolve( await Socket.get(ws) )
            //     });
            // });

            return new Promise<Socket>( (resolve, reject) => {
                const url = `${this.makeUrl(key as string, true)}?sessionId=${this.sessionId}`;
                const ws = new WSSocket(url);
                ws.on("error", (err) => {
                    reject({err});
                });
                ws.on("open", async () => {
                    let socket = await Socket.get(ws);
                    let callback = (data) => {
                        let result = JSON.parse(data);
                        do {
                            if (result.statusCode===200) { resolve(socket); break; }
                            reject({
                                res: { statusCode: result.statusCode },
                                body: result.message
                            });
                        } while(0);
                        socket.io.removeListener("message", callback);
                    }
                    socket.io.addListener("message", callback);
                });
            });
        }

        getSessionId(): string { return this.sessionId; }
    }

    interface IiSAPServerAutoConfig extends IiSAPServerBaseConfig {
        username: string;
        password: string;
        loginPath?: string;
    }
    export class iSAPAutoServerBase<T extends ApisRequestBase, W extends IiSAPServerAutoConfig = IiSAPServerAutoConfig> extends iSAPServerBase<T, W> {
        protected sjRequestLogin: Subject<void> = new Subject<void>();
        protected mtxLogin: Mutex = new Mutex();
        constructor(config: W) {
            super(config);
            config.loginPath = config.loginPath || "/users/login";
            this.sjRequestLogin.subscribe( () => this.doLogin() );
        }

        private async doLogin() {
            if (this.mtxLogin.isLocked()) return;
            await this.mtxLogin.acquire();
            this.sjLogined.next(false);
            
            let { username, password } = this.config;
            this.C(this.config.loginPath, {
                username, password
            } as any)
            .then( () => {
                this.mtxLogin.release();
            })
            .catch( (e: IGeneralRequestRejection) => {
                Log.Error(this.constructor.name, `Auto login failed: ${JSON.stringify(e)}`);
                this.mtxLogin.release();
                // setTimeout(() => this.doLogin(), 1000);
            });
        }

        private waitForLogin(): Promise<boolean> {
            return this.sjLogined.filter(v=>v).first().toPromise();
        }

        private rejection(e: IGeneralRequestRejection): boolean {
            return (e.res && e.res.statusCode===403) ? true : false;
        }

        async C<
            K extends keyof T["Post"],
            U extends ApisExtractInput<T["Post"][K]>,
            V extends ApisExtractOutput<T["Post"][K]>,
            P extends ApisExtractLoginRequired<T["Post"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'POST' | 'PUT' = 'POST'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                if (key !== this.config.loginPath) {
                    this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                    await this.waitForLogin();
                }
                super.C(key, data, spec)
                    .then( resolve )
                    .catch( async (e: IGeneralRequestRejection) => {
                        /// don't do relogin if rejection
                        if (this.rejection(e)) return reject(e);
                        this.sjRequestLogin.next();
                        await this.waitForLogin();
                        reject(e);
                    });
            }, 0, "iSAPServerC", this.rejection );
        }

        async R<
            K extends keyof T["Get"],
            U extends ApisExtractInput<T["Get"][K]>,
            V extends ApisExtractOutput<T["Get"][K]>,
            P extends ApisExtractLoginRequired<T["Get"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K, data?: U, spec: 'GET' | 'DELETE' = 'GET'): Promise<V> {

            return retry<V>( async (resolve, reject) => {
                if (key !== this.config.loginPath) {
                    this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                    await this.waitForLogin();
                }

                super.R(key, data, spec)
                    .then( resolve )
                    .catch( async (e) => {
                        this.sjRequestLogin.next();
                        await this.waitForLogin();
                        reject(e);
                    });
            }, 0, "iSAPServerC");
        }

        async WS<
            K extends keyof T["Ws"],
            U extends ApisExtractInput<T["Ws"][K]>,
            V extends ApisExtractOutput<T["Ws"][K]>,
            P extends ApisExtractLoginRequired<T["Ws"][K]>,
            C extends (P extends false ? U : ApisSessionRequired & U)
            >(key: K): Promise<Socket> {

            return retry<Socket>( async (resolve, reject) => {
                this.sjLogined.getValue() === false && (this.sjRequestLogin.next());
                await this.waitForLogin();

                super.WS(key)
                    .then( resolve )
                    .catch( (e) => {
                        console.log('reject!', e);
                        reject(e);
                    });

                //let ws = await super.WS(key);

                // let callback = (data) => {
                //     let result = JSON.parse(data);
                //     do {
                //         if (result.statusCode===200) { resolve(ws); break; }
                //         reject(result);
                //     } while(0);
                //     ws.io.removeListener("message", callback);
                // }
                // ws.io.addListener("message", callback);
            });
        }
    }

}

export async function retry<T>(
    func: (
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
    ) => void | Promise<void>,
    times: number = 10, hintname: string = null, rejectFilter: (e) => boolean = null ): Promise<T> {

    let count: number = 0;
    let err;
    return new Promise<T>( async (resolve, reject) => {
        do {
            try {
                return resolve( await new Promise<T>( (resolve, reject) => func(resolve, reject)) );
            } catch(e) {
                err = e;
            }

            /// error log
            let test = Math.log10(count);
            if (test > 0 && Number.isInteger(test)) Log.Error("Critical Error", `${hintname ? `Function <${hintname}> ` : ''}Retry ${count} times with error: ${err}`);
            /// reject when there is an error happens
            if (rejectFilter && rejectFilter(err)) break;

        } while( times === 0 || (++count < times) );
        return reject(err);
    });
}

export class Socket {
    io: WSSocket;
    private sendCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    static get(ws: WSSocket);
    static get(arg1: any, arg2?: any): Promise<Socket> {
        return new Promise( (resolve) => {
            var ws, info, cb;
            if (!arg2) {
                if (arg1 instanceof WSSocket) {
                    ws = arg1;
                    info = {}; cb = (c) => {c(ws)};
                } else {
                    ws = (<any>arg1)._websocket;   /// check response
                    if (!ws) { resolve(null); return; }
                    info = ws.info; cb = ws.cb;
                }
                
            } else {
                info = arg1; cb = arg2;
            }
            if (info.vsocket) { resolve(info.vsocket); return; }
            cb( (socket) => {
                info.vsocket = new Socket(socket);
                resolve(info.vsocket);
            });
        });
    }

    private constructor(socket: WSSocket) {
        this.io = socket;
    }

    sendPromise(data: any): Promise<void> {
        return new Promise( (resolve, reject) => {
            this.send(data, (err) => {
                if (!err) return resolve();
                reject(err);
            });
        });
    }

    send(data: any, cb?: (err: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean }, cb?: (err: Error) => void): void;
    send(data: any, arg2: any, arg3?: any) {
        typeof data === 'object' && !(data instanceof Buffer) && (data = JSON.stringify(data));
        var cb = arg3 || arg2;
        cb = this.wrapper(cb);
        this.sendCount.next(this.sendCount.getValue()+1);
        this.io.send.call(this.io, data, cb);
    }
    private wrapper(callback: (err: Error) => void): (err: Error) => void {
        return (err: Error): void => {
            callback && callback(err);
            this.sendCount.next(this.sendCount.getValue()-1);
        }
    }

    public closeGracefully() {
        let subscription = this.sendCount.observeOn(Rx.Scheduler.asap).subscribe( (value) => {
            if (value === 0) {
                this.io.close();
                subscription.unsubscribe();
            }
        });
    }
}

export class Semaphore {
    private max: number;
    private count: number;
    private promises: any[] = [];
    private completed: any[] = [];

    constructor(max: number) {
        this.max = this.count = max;
    }
    public toPromise(): Promise<void> {
        if (this.count > 0) { --this.count; return Promise.resolve(); }
        let result;
        let promise = new Promise<void>((resolve) => result = resolve);
        this.promises.push(result);
        return promise;
    }
    public acquire(): Promise<void> {
        return this.toPromise();
    }
    public release() {
        var resolve = this.promises.shift();
        if (resolve === undefined) {
            this.count = Math.min(++this.count, this.max);
            if (this.count === this.max) while (this.completed.length > 0) (this.completed.shift())();
            return;
        }
        resolve();
    }
    public onCompleted(): Promise<void> {
        if (this.count === this.max) return Promise.resolve();
        let result;
        let promise = new Promise<void>((resolve) => result = resolve);
        this.completed.push(result);
        return promise;
    }
    public isLocked(): boolean {
        return this.count === 0;
    }
}

export class Mutex extends Semaphore {
    constructor() {
        super(1);
    }
}