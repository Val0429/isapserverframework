/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import 'colors';
let caller = require('caller');

import { PrintService } from 'helpers';


export enum Level {
    Trace = 1,
    Info = 2,
    Success = 4,
    Error = 3,
}

export namespace Log {
    let currentLevel: Level = Level.Trace;
    let currentRegEx: RegExp;
    export function setLevel(level: Level, reg?: RegExp | string) {
        currentLevel = level;
        currentRegEx = typeof reg === 'string' ? new RegExp(reg) : reg;
    }

    function TestPass(level: Level): boolean {
        if (level>=currentLevel && (!currentRegEx || currentRegEx && currentRegEx.test(caller(2)))) return true;
        return false;
    }

    export function Trace(title: string, message: string): void {
        if (!TestPass(Level.Trace)) return;

        PrintService.log(`${!title ? '' : `<${title}> `}${message}`, undefined, 'message');
    }

    export function Info(title: string, message: string): void {
        if (!TestPass(Level.Info)) return;

        PrintService.log(`${!title ? '' : `<${title}> `}${message}`, undefined, 'info');
    }

    export function Success(title: string, message: string): void {
        if (!TestPass(Level.Success)) return;

        PrintService.log(`${!title ? '' : `<${title}> `}${message}`, undefined, 'success');
    }

    export function Error(title: string, message: string): void {
        if (!TestPass(Level.Error)) return;

        PrintService.log(`${!title ? '' : `<${title}> `}${message}`, undefined, 'error');
    }

    class TimeEndWrapper {
        private _title: string = '';
        private _message: string = '';
        private _type: string = '';

        private _startDate: Date = new Date();

        constructor(title: string, message: string, type: string) {
            this._title = title;
            this._message = message;
            this._type = type
        }

        public end(): void {
            let endDate: Date = new Date()
            
            PrintService.log(`${!this._title ? '' : `<${this._title}> `}${this._message} in ${endDate.getTime() - this._startDate.getTime()}ms`, undefined, this._type as any);
        }
    }

    export function TraceTime(title: string, message: string): TimeEndWrapper {
        if (!TestPass(Level.Trace)) return;
        
        return new TimeEndWrapper(title, message, 'message');
    }

    export function InfoTime(title: string, message: string): TimeEndWrapper {
        if (!TestPass(Level.Info)) return;

        return new TimeEndWrapper(title, message, 'info');
    }

    export function SuccessTime(title: string, message: string): TimeEndWrapper {
        if (!TestPass(Level.Success)) return;

        return new TimeEndWrapper(title, message, 'success');
    }
}