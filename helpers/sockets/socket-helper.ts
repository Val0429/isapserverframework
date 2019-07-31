/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import * as WSSocket from 'ws';
import { BehaviorSubject } from 'rxjs';
import * as Rx from 'rxjs/Rx';
import { Response } from 'express/lib/response';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';



export class Socket {
    io: WSSocket;
    private sendCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    static get(response: Response): Promise<Socket>;
    static get(ws: WSSocket): Promise<Socket>;
    static get(info: ExpressWsRouteInfo, cb: ExpressWsCb): Promise<Socket>;
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
    send(data: any, arg2?: any, arg3?: any) {
        typeof data === 'object' && !(data instanceof Buffer) && (data = JSON.stringify(data));
        var cb = arg3 || arg2;
        cb = cb ? this.wrapper(cb) : null;
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