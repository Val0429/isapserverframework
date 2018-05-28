import * as Parse from 'parse/node';
// import { Errors } from './../../core/errors.gen';

export namespace FileHelper {

    export async function toParseFile<T extends string | string[]>(input: T):
        Promise<
            T extends string ? Parse.File :
                Parse.File[]
        > {

        if (Array.isArray(input)) {
            var result: Parse.File[] = [];
            for (var image of input) {
                result.push(await toParseFile(image));
            }
            // var result = <any>input.map( async (value: string) => {
            //     return await toParseFile(value)
            // });
            // console.log(result);
            return <any>result;
        }

        var file = new Parse.File(`image.b64`, { base64: input });
        await file.save();
        return <any>file;
    }

}
