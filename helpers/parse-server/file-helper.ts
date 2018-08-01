import * as Parse from 'parse/node';
import { Config } from 'core/config.gen';
import * as mimeType from 'mime-types';

export namespace FileHelper {

    /// save base64 file(s) into Parse.File(s), and return.
    export async function toParseFile<T extends string | string[]>(input: T, name: string = null, mime: string = null):
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

        /// Parse input for ext name
        var regex = /^data:([^;]+);base64,/i;
        var type = null;
        input = <any>(<string>input).replace(regex, (a, b) => { type = b; return ""; });
        if (type !== null) name = `file.${mimeType.extension(type)}`;

        var file = new Parse.File(`${name || 'file.b64'}`, { base64: input }, mime);
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
