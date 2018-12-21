import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, IConfig, Config, IConfigSetup,
    Action, Errors, Floors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';
import * as request from 'request';
import { actions } from 'helpers/routers/router-loader';

var action = new Action({
    loginRequired: true,
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
        // !final[uri] && (final[uri] = {});
        let obj = {};

        for (let proto of action.list()) {
            let loginRequired: boolean = false;
            let hasInputType: boolean = false;
            switch (proto) {
                case 'All':
                case 'Get':
                case 'Post':
                case 'Put':
                case 'Delete':
                    /// get configs
                    /// login required?
                    loginRequired = (action[`func${proto}Config`] || {}).loginRequired || ((action.config || {}).loginRequired);
                    hasInputType = (action[`func${proto}Config`] || {}).inputType || ((action.config || {}).inputType) ? true : false;

                    let method = (proto === 'All' ? 'Get' : proto).toUpperCase();

                    let result: string;
                    try {
                    result = await new Promise<string>( (resolve, reject) => {
                        request({
                            url: `http://localhost:${Config.core.port}${uri}?help&sessionId=${data.parameters.sessionId}`,
                            method,
                        }, (err, res, body) => {
                            if (res.statusCode === 401) return reject(401);
                            resolve(body);
                        });
                    });
                    } catch(e) {
                        continue;
                    }
                    if (!hasInputType) {
                        obj[proto] = { input: null, output: null, loginRequired };
                        break;
                    }

                    /// extract input interface
                    const iRegex = /Input Interface:(?:\r?\n|\r)=+(?:\r?\n|\r)*/;
                    let imatch = iRegex.exec(result);
                    /// extract output interface
                    const oRegex = /(?:\r?\n|\r)*Output Interface:(?:\r?\n|\r)=+(?:\r?\n|\r)*/;
                    let omatch = oRegex.exec(result);

                    /// matches
                    let input = null;
                    if (imatch !== null) {
                        let istart = imatch.index + imatch[0].length;
                        let iend = omatch ? omatch.index : result.length;
                        input = result.substring(istart, iend);
                    }

                    let output = null;
                    if (omatch !== null) {
                        let ostart = omatch.index + omatch[0].length;
                        let oend = result.length;
                        output = result.substring(ostart, oend).replace(/(?:\r?\n|\r)*$/, '');
                    }

                    obj[proto] = { input, output, loginRequired };

                    break;
                case 'Ws':
                    /// get configs
                    /// login required?
                    loginRequired = (action[`func${proto}Config`] || {}).loginRequired || ((action.config || {}).loginRequired);
                    obj[proto] = { input: null, output: null, loginRequired };
                default:
                    break;
            }
        }
        if (Object.keys(obj).length !== 0 && obj.constructor === Object) final[uri] = obj;
    }

    return final;
});
/// CRUD end ///////////////////////////////////

export default action;
