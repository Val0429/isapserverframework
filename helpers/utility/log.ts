import 'colors';
import { padLeft } from './pad-left';
let caller = require('caller');

export enum Level {
    Trace = 1,
    Info = 2,
    Error = 3
}

export namespace Log {
    let currentLevel: Level = Level.Trace;
    let currentRegEx: RegExp;
    export function setLevel(level: Level, reg?: RegExp | string) {
        currentLevel = level;
        currentRegEx = typeof reg === 'string' ? new RegExp(reg) : reg;
    }

    function timestamp(): string {
        let now = new Date();
        return `${'['.grey}` +
               `${now.getMonth()+1}/${padLeft(now.getDate(),2)} ${padLeft(now.getHours(),2)}:${padLeft(now.getMinutes(),2)}:${padLeft(now.getSeconds(),2)}.${padLeft(now.getMilliseconds(),3)}`.cyan +
               `${']'.grey} `;
    }

    function TestPass(level: Level): boolean {
        if (
            level>=currentLevel &&
            (!currentRegEx || currentRegEx && currentRegEx.test(caller(2)))
        ) return true;
        return false;
    }

    let getTraceMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".grey}${title.white}${">".grey} ${message}`;
    let getInfoMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".magenta}${title.yellow}${">".magenta} ${message}`;
    let getErrorMessage = (title: string, message: string, withTimestamp: boolean = true) => `${withTimestamp?timestamp():''}${"<".red}${title.white.bgRed}${">".red} ${message}`;

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

    export function TraceTime(title: string, message: string) {
        if (!TestPass(Level.Trace)) return;
        let msg = getTraceMessage(title, message, false);
        console.time(msg);
        return msg;
    }

    export function TraceTimeEnd(title: string, message: string) {
        if (!TestPass(Level.Trace)) return;
        let msg = getTraceMessage(title, message, false);
        console.timeEnd(msg);
        return msg;
    }

    export function InfoTime(title: string, message: string) {
        if (!TestPass(Level.Info)) return;
        let msg = getInfoMessage(title, message, false);
        console.time(msg);
        return msg;
    }

    export function InfoTimeEnd(title: string, message: string) {
        if (!TestPass(Level.Info)) return;
        let msg = getInfoMessage(title, message, false);
        console.timeEnd(msg);
        return msg;
    }
}