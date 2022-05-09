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
import { Retrier } from 'helpers/utility/retrier';


export class Socket {
    io: WSSocket;
    private sendCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    static get(response: Response): Promise<Socket>;
    static get(ws: WSSocket): Promise<Socket>;
    static get(url: string): Promise<Socket>;
    static get(info: ExpressWsRouteInfo, cb: ExpressWsCb): Promise<Socket>;
    static get(arg1: any, arg2?: any): Promise<Socket> {
        return new Promise( async (resolve, reject) => {
            var ws, info, cb;
            if (!arg2) {
                if (typeof arg1 === "string") {
                    try {
                        arg1 = new WSSocket(arg1);
                        await new Promise((resolve, reject) => {
                            let handled: boolean = false;
                            let openListener = () => !handled && (handled = true, resolve(null));
                            let errorListener = (e) => !handled && (handled = true, reject(e));
                            arg1.addListener("open", openListener);
                            arg1.addListener("close", errorListener);
                            arg1.addListener("error", errorListener);
                        });
                    } catch(e) { reject(e) }
                }
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

                /// apply ping / pong rule on it
                const pingInterval: number = 10000;
                const pongInterval: number = pingInterval / 2 * 3;
                let pingRetrier = new Retrier(() => { pingRetrier.stop(); pongRetrier.start(); socket.ping("ping"); }, pingInterval);
                let pongRetrier = new Retrier(() => { pingRetrier.stop(); pongRetrier.stop(); socket.terminate(); }, pongInterval);
                socket.addListener("pong", () => { pingRetrier.start(); pongRetrier.stop(); });
                socket.addListener("open", () => { pingRetrier.start(); pongRetrier.stop(); });
                socket.addListener("close", () => { pingRetrier.stop(); pongRetrier.stop(); });

                resolve(info.vsocket);
            });
        });
    }

    private constructor(socket: WSSocket) {
        this.io = socket;
    }

    sendPromise(data: any): Promise<void> {
        return new Promise( (resolve, reject) => {
            this.sendCount.next(this.sendCount.getValue()+1);
            this.send(data, (err) => {
                this.sendCount.next(this.sendCount.getValue()-1);
                if (!err) return resolve();
                reject(err);
            });
        });
    }

    send(data: any, cb?: (err: Error) => void): void;
    // send(data: any, options: { mask?: boolean; binary?: boolean }, cb?: (err: Error) => void): void;
    // send(data: any, arg2?: any, arg3?: any) {
    send(data: any, arg2?: any) {
        typeof data === 'object' && !(data instanceof Buffer) && (data = JSON.stringify(data));
        var cb = arg2;
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

    public async closeGracefully() {
        await this.sendCount.filter(v => v === 0).first().toPromise();
        this.io.close();
    }
}