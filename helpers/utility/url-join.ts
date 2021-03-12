const UrlJoin = require("url-join");

export namespace Url {
    export function join(...args: string[]) {
        /// remove undefined
        args = args.reduce((final, arg) => {
            if (arg != undefined) final.push(arg);
            return final;
        }, []);
        return UrlJoin(...args);
    }
}
