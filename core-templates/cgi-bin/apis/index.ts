/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IConfig, Config, IConfigSetup,
    Action, Errors,
    Restful, FileHelper, ParseObject, ActionConfig
} from 'core/cgi-package';
import * as request from 'request';
import { actions } from 'helpers/routers/router-loader';

let packinfo = require(`${__dirname}/../../../package.json`);
let wspackinfo = require(`${__dirname}/../../package.json`);

var action = new Action({
    loginRequired: false,
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
action.get( async (data) => {
    let final: Restful.ApisOutput = {};

    for (let action of actions) {
        let uri = action.uri;
        if (uri === '/apis') continue;

        const makeOnce = (config: ActionConfig<any, any>, proto: any) => {
            const protos = ['Get', 'Post', 'Put', 'Delete'];
            if (proto === 'All') return protos.forEach(p => makeOnce(config, p));

            const path = config.path;
            const thisUri = uri + (path ? path : '');
            let obj = final[thisUri] || {};

            try {
                let loginRequired = config.loginRequired;
                const strt = { input: null, output: null, loginRequired };
                if (!loginRequired) { obj[proto] = strt; return; }
                if (!data.role) return;
                let roles = data.role.map(v => v.get("name"));
                let permitRoles: string[] = config.permission;
                let result = permitRoles ? roles.reduce( (final, role) => {
                    if (permitRoles.indexOf(role) >= 0) final.push(role);
                    return final;
                }, []) : roles;
                if (result.length > 0) obj[proto] = strt;
                else delete obj[proto];

            } finally {
                if (Object.keys(obj).length !== 0) final[thisUri] = obj;
            }
        }

        let config = action.config;
        for (let proto of action.list()) {
            let inners = action[`func${proto}`];
            for (let inner of inners) {
                makeOnce({ ...config, ...inner.config }, proto);
            }
        }
    }

    return {
        serverName: packinfo.name,
        serverVersion: packinfo.version,
        serverDescription: packinfo.description,
        frameworkVersion: packinfo.frameworkversion,
        copyright: wspackinfo.copyright || packinfo.copyright,
        APIs: final
    }
});
/// CRUD end ///////////////////////////////////

export default action;
