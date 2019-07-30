/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { ActionParam } from "helpers/cgi-helpers/core";
import { Subject, Observable } from "rxjs";
import { Errors } from "core/errors.gen";
import { Socket } from 'helpers/sockets/socket-helper';

export enum Aliveness {
    Offline,
    Online
}
export interface KeepAliveData {
    instance: Parse.User;
    socket: Socket;
}
export interface KeepAliveRealTime {
    alive: Aliveness;
    instance: Parse.User;
    socket: Socket;
}

export class KeepAliveHost {
    private name: string;
    private alives: KeepAliveData[] = [];
    private sjRealtimeAlives: Subject<KeepAliveRealTime> = new Subject<KeepAliveRealTime>();

    /**
     * @param name What is this aliveness name? ex: Kiosk, Boat
     */
    constructor(name: string = undefined) {
        this.name = name;
    }

    list(): KeepAliveData[] {
        return this.alives.map( data => ({ ...data }) );
    }

    getAliveObservable(): Observable<KeepAliveRealTime> {
        return this.sjRealtimeAlives.asObservable();
    }

    send(data: string);
    send(filter: (data: KeepAliveData) => boolean, data: string);
    send(filter: ((data: KeepAliveData) => boolean) | string, data?: string) {
        let mfilter: (data: KeepAliveData) => boolean = data ? filter as any : null;
        let mdata: string = data || filter as any;

        this.alives.forEach( (instance) => {
            if (mfilter && !mfilter(instance)) return;
            instance.socket.send(mdata);
        })
    }

    next<T>(data: ActionParam<T>) {
        let { user, socket } = data;
        
        /// if already exists, throw error
        if (user) {
            let found: boolean = this.alives.find( (instance) => {
                return instance.instance.id === user.id ? true : false
            }) !== undefined;
            if (found) throw Errors.throw(Errors.CustomBadRequest, [`Cannot keep alive single ${this.name || 'instance'} multiple times.`]);
        }

        /// otherwise add
        this.alives.push({ instance: user, socket });
        /// send to pipeline
        this.sjRealtimeAlives.next({ alive: Aliveness.Online, instance: user, socket });

        /// take over socket
        socket.io.on("close", () => {
            let idx = this.alives.findIndex( (instance) => {
                return instance.socket === socket ? true : false
            });
            if (idx < 0) return;
    
            /// remove
            let instance = this.alives.splice(idx, 1)[0];
            /// send to pipeline
            this.sjRealtimeAlives.next({ alive: Aliveness.Offline, ...instance });
        });
    
    }
}
