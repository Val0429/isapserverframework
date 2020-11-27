import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import * as Permission from 'workspace/define/userRoles/userPermission.define';
import { actions } from 'helpers/routers/router-loader';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Get
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        middlewares: [BasicAuth(Permission['permissionServerApiR'])],
    },
    async (data): Promise<OutputR> => {
        try {
            let response = actions.map((n) => {
                let login: boolean = !!n.config.loginRequired;

                let detail = {
                    uri: n.uri,
                    login: login,
                };

                if ('funcPostConfig' in n) {
                    detail['post'] = FuncConfig(n.funcPostConfig, login);
                }
                if ('funcGetConfig' in n) {
                    detail['get'] = FuncConfig(n.funcGetConfig, login);
                }
                if ('funcPutConfig' in n) {
                    detail['put'] = FuncConfig(n.funcPutConfig, login);
                }
                if ('funcDeleteConfig' in n) {
                    detail['delete'] = FuncConfig(n.funcDeleteConfig, login);
                }
                if ('funcWsConfig' in n) {
                    detail['ws'] = FuncConfig(n.funcWsConfig, login);
                }

                return detail;
            });

            return `<pre>${JSON.stringify(response, null, 4)}</pre>`;
        } catch (e) {
            throw e;
        }
    },
);

/**
 *
 * @param funcConfig
 * @param login
 */
function FuncConfig(config: object, login: boolean): object {
    try {
        if (!config) {
            return undefined;
        }

        let detail: object = {};

        if (!!config['loginRequired']) {
            detail['loginRequired'] = config['loginRequired'];
        }

        if (!!config['loginRequired'] || login) {
            if (!config['permission'] || config['permission'].length == 0) {
                detail['permission'] = Object.keys(RoleList);
            } else {
                detail['permission'] = config['permission'].map((o) => Object.keys(RoleList).find((p) => o === RoleList[p]));
            }
        }

        if (!!config['middlewares']) {
            detail['middlewares'] = config['middlewares'].map((o) => o.name);
        }

        return detail;
    } catch (e) {
        throw e;
    }
}
