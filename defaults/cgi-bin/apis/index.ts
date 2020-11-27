import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import { actions } from 'helpers/routers/router-loader';
import * as Path from 'path';

var action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Get
 */
type InputR = null;

type OutputR = object;

action.get(
    {},
    async (data): Promise<OutputR> => {
        try {
            let packinfo = require(Path.resolve('package.json'));

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
                            loginRequired = (action[`func${proto}Config`] || {}).loginRequired || (action.config || {}).loginRequired;
                            hasInputType = (action[`func${proto}Config`] || {}).inputType || (action.config || {}).inputType ? true : false;

                            obj[proto] = { input: null, output: null, loginRequired };
                            break;
                        case 'Ws':
                            /// get configs
                            /// login required?
                            let config = action[`func${proto}Config`] || action.config || {};
                            let strt = { input: null, output: null, loginRequired };
                            loginRequired = config.loginRequired;
                            if (!loginRequired) {
                                obj[proto] = strt;
                                break;
                            }
                            if (!data.role) break;
                            let roles = data.role.map((v) => v.attributes.name);
                            let permitRoles: string[] = config.permission;
                            let final = permitRoles
                                ? roles.reduce((final, role) => {
                                      if (permitRoles.indexOf(role) >= 0) final.push(role);
                                      return final;
                                  }, [])
                                : roles;
                            if (final.length > 0) obj[proto] = strt;
                            break;
                        default:
                            break;
                    }
                }
                if (Object.keys(obj).length !== 0 && obj.constructor === Object) final[uri] = obj;
            }

            return {
                serverVersion: packinfo.version,
                frameworkVersion: packinfo.frameworkversion,
                APIs: final,
            };
        } catch (e) {
            throw e;
        }
    },
);
