/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import 'colors';
import { padLeft } from './pad-left';
let caller = require('caller');

export enum Level {
    Trace = 1,
    Info = 2,
    Error = 3
}

export namespace Log {
    let currentLevel: Level = Level.Info;
    let currentRegEx: RegExp;
    export function setLevel(level: Level, reg?: RegExp | string) {
        currentLevel = level;
        currentRegEx = typeof reg === 'string' ? new RegExp(reg) : reg;
    }

    function TestPass(level: Level): boolean {
        if (
            level>=currentLevel &&
            (!currentRegEx || currentRegEx && currentRegEx.test(caller(2)))
        ) return true;
        return false;
    }

    let getTraceMessage = (title: string, message: string) => `${"<".grey}${title.white}${">".grey} ${message}`;
    let getInfoMessage = (title: string, message: string) => `${"<".magenta}${title.yellow}${">".magenta} ${message}`;
    let getErrorMessage = (title: string, message: string) => `${"<".red}${title.white.bgRed}${">".red} ${message}`;

    export function Trace(title: string, message: string) {
        if (!TestPass(Level.Trace)) return;
        let msg = getTraceMessage(title, message);
        console.log(msg);
        return msg;
    }

    export function Info(title: string, message: string) {
        if (!TestPass(Level.Info)) return;
        let msg = getInfoMessage(title, message);
        console.log(msg);
        return msg;
    }

    export function Error(title: string, message: string) {
        if (!TestPass(Level.Error)) return;
        let msg = getErrorMessage(title, message);
        console.log(msg);
        return msg;
    }

    class DummyWrapper {
        constructor() {}
        public end() {}
    }

    class TimeEndWrapper {
        private msg: string;
        constructor(msg: string) {
            this.msg = msg;
        }
        public end() {
            console.timeEnd(this.msg);
        }
    }

    let timeCount = 0;
    export function TraceTime(title: string, message: string) {
        if (!TestPass(Level.Trace)) return new DummyWrapper();
        let msg = getTraceMessage(title, message) + `(#${++timeCount})`;
        console.time(msg);
        return new TimeEndWrapper(msg);
    }

    export function InfoTime(title: string, message: string) {
        if (!TestPass(Level.Info)) return new DummyWrapper();
        let msg = getInfoMessage(title, message) + `(#${++timeCount})`;
        console.time(msg);
        return new TimeEndWrapper(msg);
    }

    // export function InfoTimeEnd(title: string, message: string) {
    //     if (!TestPass(Level.Info)) return;
    //     let msg = getInfoMessage(title, message, false) + `(#${++timeCount})`;
    //     console.timeEnd(msg);
    //     return new TimeEndWrapper(msg);
    // }
}