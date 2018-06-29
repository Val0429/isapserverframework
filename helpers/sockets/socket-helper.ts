import * as WSSocket from 'ws';
import { BehaviorSubject } from 'rxjs';
import { Response } from 'express/lib/response';
import { ExpressWsRouteInfo, ExpressWsCb } from './../middlewares/express-ws-routes';

export class Socket {
    io: WSSocket;
    private sendCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    static get(response: Response);
    static get(info: ExpressWsRouteInfo, cb: ExpressWsCb);
    static get(arg1: any, arg2?: any): Promise<Socket> {
        return new Promise( (resolve) => {
            var ws, info, cb;
            if (!arg2) {
                /// check response
                ws = (<any>arg1)._websocket;
                if (!ws) { resolve(null); return; }
                info = ws.info; cb = ws.cb;
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

    send(data: any, cb?: (err: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean }, cb?: (err: Error) => void): void;
    send(data: any, arg2: any, arg3?: any) {
        var cb = arg3 || arg2;
        cb = this.wrapper(cb);
        arguments[arg3 ? 2 : 1] = cb;
        this.sendCount.next(this.sendCount.getValue()+1);
        this.io.send.apply(this.io, arguments);
    }
    private wrapper(callback: (err: Error) => void): (err: Error) => void {
        return (err: Error): void => {
            callback(err);
            this.sendCount.next(this.sendCount.getValue()-1);
        }
    }

    public closeGracefully() {
        var subscription = this.sendCount.subscribe( (value) => {
            if (value === 0) {
                this.io.close();
                subscription.unsubscribe();
            }
        });
    }
}