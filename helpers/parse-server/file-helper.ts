/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Config } from 'core/config.gen';
import * as mimeType from 'mime-types';
import * as path from 'path';
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

    export function toBase64FromBuffer(input: Buffer) {
        return input.toString("base64");
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
        let regex_base64 = /^data:([^;]+);base64,/i;
        let regex_uri = /^http/i;
        let base64: string, uri: string;
        if (regex_base64.test(<string>input)) {
            let type = null;
            base64 = <any>(<string>input).replace(regex_base64, (a, b) => { type = b; return ""; });
            if (type !== null) name = `file.${mimeType.extension(type) || "b64"}`;
        }
        else if (regex_uri.test(<string>input)) {
            uri = <string>input;
            let parsed = path.parse(uri);
            name = parsed.base;
        }
        else {
            base64 = <string>input;
        }

        var file = new Parse.File(`${name || 'file.b64'}`, { base64, uri }, mime);
        await file.save();
        return <any>file;
    }

    // export function getURL(file: Parse.File): string {
    //     var url = file.url();
    //     /// todo, make it right.
    //     url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
    //     return url;
    // }

    export function getURLProtocolPrefix(data: ActionParam<any>): string {
        let { localAddress, localPort } = data.request.connection;
        /// workaround, ::1 treat as localhost
        if (localAddress === "::1") localAddress = ":localhost";
        return `${data.request.protocol}://${localAddress.replace(/^.*:/, '')}:${localPort}`;
    }

    export function getURI(file: Parse.File) {
        let url = file.url();
        return url.replace(/^(\w+)(\:\/\/)(localhost(?:\:[0-9]*)?)/, (a, b, c, d) => {
            return "";
        });
    }

    export function getURL(file: Parse.File, data: ActionParam<any>);
    export function getURL(file: Parse.File);
    export function getURL(file: Parse.File, data?: ActionParam<any>): string {
        let url = file.url();
        
        if (!data) {
            url = url.replace(/\:([0-9]+)/, (a, b) => `:${Config.core.port}`);
        } else {
            url = url.replace(/^(\w+)(\:\/\/)(localhost(?:\:[0-9]*)?)/, (a, b, c, d) => {
                return getURLProtocolPrefix(data);
            });

            // let { localAddress, localPort } = data.request.connection;
            // /// workaround, ::1 treat as localhost
            // if (localAddress === "::1") localAddress = ":localhost";
            // url = url.replace(/^(\w+)(\:\/\/)(localhost(?:\:[0-9]*)?)/, (a, b, c, d) => {
            //     return `${data.request.protocol}${c}${localAddress.replace(/^.*:/, '')}:${localPort}`;
            // });
        }
        return url;
    }

    export async function downloadParseFile(file: Parse.File): Promise<Buffer> {
        var url = getURL(file);
        var res = await Parse.Cloud.httpRequest({ url });
        return res.buffer;
    }

}
