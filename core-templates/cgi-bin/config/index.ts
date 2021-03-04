/*
 * Created on Tue May 11 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IConfig, Config, IConfigSetup,
    Action, Errors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';
import ConfigManager from 'helpers/shells/config-manager';
//import { sfeConfigType } from "core/config.gen";
import * as configtype from "core/config.gen";
import * as path from "path";

import ast from 'services/ast-services/ast-client';

var action = new Action({
    loginRequired: false
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
interface InputR {
    key?: string;
}
type OutputR = IConfig | IConfig[keyof IConfig];

action.get<InputR, OutputR>({ inputType: "InputR", path: "/(:key)?" }, async (data) => {
    let { key } = data.inputType;
    key = data.request.params.key || key;
    let config = key ? Config[key] : Config;
    if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);
    return config;
});

/********************************
 * C: update object
 ********************************/
interface InputC {
    data: IConfigSetup;
}
type OutputC = any;
action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    var value = data.inputType.data;
    for (var key in value) {
        await ConfigManager.update(key as any, value[key]);
    }
    return value;
});

/// post with key

action.post({ path: "/:key" }, async (data) => {
    let { parameters } = data;
    let key = data.request.params.key;
    var value = await ast.requestValidation({
        path: path.resolve(__dirname, "./../../../core/config.gen.ts"),
        type: `${key}ConfigTypeP`
    }, parameters);

    await ConfigManager.update(key as any, value);
    return value;
});
// /// CRUD end ///////////////////////////////////

export default action;
