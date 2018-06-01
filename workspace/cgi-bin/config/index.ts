import {
    express, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Config, IConfig,
} from './../../../core/cgi-package';

// export interface Input {
//     sessionId: string;
// }

// export interface FloorUnit {
//     objectId: string;
//     floor: number;
//     unitNo: string;
//     phone: string[];
// }

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
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
    /// Check param requirement

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
    key: string;

    /**
     * { key: value } to update the config.
     */
    data: object;
}
action.post<InputPost>("/:key(\\w{0,})", async (data) => {
    /// Check param requirement
    if (!data.parameters.key) throw Errors.throw(Errors.ParametersRequired, ["key"]);

    /// check key
    var key = data.parameters.key;
    var config = Config[key];
    if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);

    /// check data
    var content = data.parameters.data;
    for (var k in content) {
        if (!config[k]) throw Errors.throw(Errors.ParametersInvalid, [`data.${k}`]);
    }

    /// update data
    await updateConfig(key, content);
    /// update memory
    Config[key] = { ...Config[key], ...content };

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
    for (var dir of [wsDefPath, wsCustomPath]) {
        var files: string[] = <any>await promisify(fs.readdir)(dir);
        for (var file of files) {
            var name = p.parse(file).name;
            if (name === key) {
                result = `${dir}/${name}.ts`;
                break;
            }
        }
        if (result) break;
    }
    console.log('result?', result);
    if (!result) throw "should not happen";

    /// 2) read file
    var content: string = await (promisify(fs.readFile) as any)(result, "UTF-8");
    console.log("content?", content);

    /// 2) match export default {0}
    var regex = /export default ([^\s;]+)/;
    var matches = content.match(regex);
    console.log("matches", matches);
    

    /// 3) match {0} with var {0}: any = { }. get inside braclets as {1}

    /// 4) replace {1} with data

}