import 'colors';

export namespace Log {
    export function Info(title: string, message: string) {
        console.log(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }

    export function Error(title: string, message: string) {
        console.log(`${"<".red}${title.white.bgRed}${">".red} ${message}`);
    }

    export function time(title: string, message: string) {
        console.time(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }

    export function timeEnd(title: string, message: string) {
        console.timeEnd(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }
}