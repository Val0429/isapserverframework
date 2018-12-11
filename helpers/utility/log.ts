import 'colors';
import { padLeft } from './pad-left';


export namespace Log {
    function timestamp(): string {
        let now = new Date();
        return `${'['.grey}` +
               `${now.getMonth()+1}/${padLeft(now.getDate(),2)} ${padLeft(now.getHours(),2)}:${padLeft(now.getMinutes(),2)}:${padLeft(now.getSeconds(),2)}.${padLeft(now.getMilliseconds(),3)}`.cyan +
               `${']'.grey} `;
    }

    export function Info(title: string, message: string) {
        console.log(`${timestamp()}${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }

    export function Error(title: string, message: string) {
        console.log(`${timestamp()}${"<".red}${title.white.bgRed}${">".red} ${message}`);
    }

    export function time(title: string, message: string) {
        console.time(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }

    export function timeEnd(title: string, message: string) {
        console.timeEnd(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }
}