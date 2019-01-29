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

    function timestamp(): string {
        let now = new Date();
        return `${'['.grey}` +
               `${now.getMonth()+1}/${padLeft(now.getDate(),2)} ${padLeft(now.getHours(),2)}:${padLeft(now.getMinutes(),2)}:${padLeft(now.getSeconds(),2)}.${padLeft(now.getMilliseconds(),3)}`.cyan +
               `${']'.grey} `;
    }

    function TestPass(level: Level, path: string): boolean {
        if (
            level>=currentLevel &&
            (!currentRegEx || currentRegEx && currentRegEx.test(path))
        ) return true;
        return false;
    }

    export function Trace(title: string, message: string) {
        if (!TestPass(Level.Trace, caller())) return;
        let msg = `${timestamp()}${"<".grey}${title.white}${">".grey} ${message}`;
        console.log(msg);
        return msg;
    }

    export function Info(title: string, message: string) {
        if (!TestPass(Level.Info, caller())) return;
        let msg = `${timestamp()}${"<".magenta}${title.yellow}${">".magenta} ${message}`;
        console.log(msg);
        return msg;
    }

    export function Error(title: string, message: string) {
        if (!TestPass(Level.Error, caller())) return;
        let msg = `${timestamp()}${"<".red}${title.white.bgRed}${">".red} ${message}`;
        console.log(msg);
        return msg;
    }

    export function time(title: string, message: string) {
        let msg = `${"<".magenta}${title.yellow}${">".magenta} ${message}`;
        console.time(msg);
        return msg;
    }

    export function timeEnd(title: string, message: string) {
        let msg = `${"<".magenta}${title.yellow}${">".magenta} ${message}`;
        console.timeEnd(msg);
        return msg;
    }
}