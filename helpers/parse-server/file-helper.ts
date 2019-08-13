/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Config } from 'core/config.gen';
import * as mimeType from 'mime-types';
import { ActionParam } from 'helpers/cgi-helpers/core';

export namespace FileHelper {

    export function removeBase64Meta(input: string): string {
        var regex = /^data:([^;]+);base64,/i;
        return input.replace(regex, "");
    }

    export function toBufferFromBase64(input: string) {
        var regex = /^data:([^;]+);base64,/i;
        var tmpstr = input.replace(regex, "");
        return new Buffer(tmpstr, 'base64');
    }

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

    // export function getURL(file: Parse.File): string {
    //     var url = file.url();
    //     /// todo, make it right.
    //     url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
    //     return url;
    // }

    export function getURL(file: Parse.File, data: ActionParam<any>);
    export function getURL(file: Parse.File);
    export function getURL(file: Parse.File, data?: ActionParam<any>): string {
        let url = file.url();
        let { localAddress, localPort } = data.request.connection;
        
        if (!data) {
            url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
        } else {
            url = url.replace(/(\:\/\/)(localhost(?:\:[0-9]*)?)/, (a, b, c, d) => {
                return `${b}${localAddress.replace(/^.*:/, '')}:${localPort}`;
            });
        }
        return url;
    }

    export async function downloadParseFile(file: Parse.File): Promise<Buffer> {
        var url = getURL(file);
        var res = await Parse.Cloud.httpRequest({ url });
        return res.buffer;
    }

}
