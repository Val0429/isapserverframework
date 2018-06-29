import * as WSSocket from 'ws';
import { BehaviorSubject } from 'rxjs';

export class Socket {
    io: WSSocket;
    private sendCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    constructor(socket: WSSocket) {
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