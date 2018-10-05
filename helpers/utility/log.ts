import 'colors';

export namespace Log {
    export function Info(title: string, message: string) {
        console.log(`${"<".magenta}${title.yellow}${">".magenta} ${message}`);
    }

    export function Error(title: string, message: string) {
        console.log(`${"<".red}${title.white.bgRed}${">".red} ${message}`);
    }
}