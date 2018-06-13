import {
    express, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Events, EventConfigChanged,
    Config, IConfig,
} from './../../../core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});

/// GET: get config /////////////////////////////////////
export interface InputGet {
    sessionId: string;

    /**
     * can be from params: config sub catagory
     */
    key?: string;
}
export type OutputGet = IConfig | IConfig[keyof IConfig];
action.get<InputGet, OutputGet>("/:key(\\w{0,})", async (data) => {
    var key = data.parameters.key;
    var config = key ? Config[key] : Config;
    if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);

    return config;
});
/////////////////////////////////////////////////////////

/// POST: modify config /////////////////////////////////
export interface InputPost {
    sessionId: string;

    /**
     * can be from params: config sub catagory
     */
    key?: string;

    /**
     * { key: value } to update the config.
     */
    data: object;
}
action.post<InputPost>({
    path: "/:key(\\w{0,})",
}, async (data) => {
    
    var updateSingleKey = async (key: string, data) => {
        /// check key
        var config = Config[key];
        if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);
        
        /// check data
        for (var k in data) {
            if (config[k] === undefined) throw Errors.throw(Errors.ParametersInvalid, [`data.${k}`]);
        }

        /// update data
        await updateConfig(key, data);
        /// update memory
        Config[key] = { ...Config[key], ...data };
    }

    /// write event
    var { key, data: value } = data.parameters;
    var event = new EventConfigChanged({
        owner: data.user,
        key, value
    });
    await Events.save(event);

    /// update
    if (key) await updateSingleKey(key, value);
    else {
        for (var key in value) {
            await updateSingleKey(key, value[key]);
        }
    }

    // /// check key
    // var key = data.parameters.key;
    // var config = Config[key];
    // if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);

    // /// check data
    // var content = data.parameters.data;
    // for (var k in content) {
    //     if (config[k] === undefined) throw Errors.throw(Errors.ParametersInvalid, [`data.${k}`]);
    // }

    // /// update data
    // await updateConfig(key, content);
    // /// update memory
    // Config[key] = { ...Config[key], ...content };

    return;
});
/////////////////////////////////////////////////////////

export default action;


import { wsDefPath, wsCustomPath } from './../../../shells/config.shell';
import * as p from 'path';
import * as fs from 'fs';
import { promisify } from 'bluebird';

async function updateConfig(key: string, data: object) {
    /// 1) find real path of workspace config
    var result;
    var regex = /[A-Z]/g;
    var dashedKey = key.replace(regex, (a, b) => `-${a.toLowerCase()}`);

    for (var dir of [wsDefPath, wsCustomPath]) {
        var files: string[] = <any>await promisify(fs.readdir)(dir);
        for (var file of files) {
            var name = p.parse(file).name;
            if (name === dashedKey) {
                result = `${dir}/${dashedKey}.ts`;
                break;
            }
        }
        if (result) break;
    }
    if (!result) throw Errors.throw(Errors.Custom, [`config path not found <${key}>`]);

    /// 2) read file
    var content: string = await (promisify(fs.readFile) as any)(result, "UTF-8");

    /// 2) match export default {0}
    var regex = /export default ([^\s;]+)/;
    var matches = content.match(regex);
    if (matches.length < 2) throw Errors.throw(Errors.Custom, [`config path format error <${key}>`]);
    var token = matches[1];

    /// 3) match {0} with var {0}: any = { }.
    var regex = new RegExp(` ${token}[\: \=]`);
    var found = content.search(regex);
    if (found < 0) throw Errors.throw(Errors.Custom, [`config path format error <${key}>`]);

    /// 4) get content of 3) inside braclets as {1}
    var start, end, ct = 1;
    for (var i = found+1; i<content.length; ++i) {
        var tok = content[i];
        if (!start) { if (tok === '{') start = i; continue; }
        switch (tok) { case '{': ct++; break; case '}': ct--; break; default: break; }
        if (ct === 0) { end = i+1; break; }
    }
    if (!start || !end) throw Errors.throw(Errors.Custom, [`config path format error <${key}>`]);
    var innerContent = content.substring(start, end);
    var parser = (input: string): object => {
        /// remove trailing comma
        return eval(`(${input})`);
    }
    var innerObject = parser(innerContent);

    /// 5) replace {1} with data
    innerObject = { ...innerObject, ...data };
    var prettifier = (input: string): string => {
        var regex = /"([^"]+)":/mg;
        return input.replace(regex, (a, b) => b+':');
    }
    var final = `${content.substring(0, start)}${prettifier(JSON.stringify(innerObject, undefined, 4))}${content.substring(end)}`;

    /// 6) write back
    await (<any>promisify(fs.writeFile))(result, final);
}

