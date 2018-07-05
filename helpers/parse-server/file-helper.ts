import * as Parse from 'parse/node';
import { Config } from './../../core/config.gen';
// import { Errors } from './../../core/errors.gen';

export namespace FileHelper {

    /// save base64 file(s) into Parse.File(s), and return.
    export async function toParseFile<T extends string | string[]>(input: T, extName: string = null):
        Promise<
            T extends string ? Parse.File :
                Parse.File[]
        > {

        if (Array.isArray(input)) {
            var result: Parse.File[] = [];
            for (var image of input) {
                result.push(await toParseFile(image));
            }
            return <any>result;
        }

        var file = new Parse.File(`image.${extName || 'b64'}`, { base64: input });
        await file.save();
        return <any>file;
    }

    export function getURL(file: Parse.File): string {
        var url = file.url();
        /// todo, make it right.
        url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
        return url;
    }

}
