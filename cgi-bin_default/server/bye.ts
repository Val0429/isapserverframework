import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import * as Permission from 'workspace/define/userRoles/userPermission.define';

let action = new Action({});

export default action;

/**
 * Action Post
 */
type InputC = null;

type OutputC = string;

action.post(
    {
        loginRequired: true,
        permission: [RoleList.SystemAdministrator],
    },
    async (data): Promise<OutputC> => {
        try {
            setTimeout(() => {
                process.exit(1);
            }, 0);

            return 'bye';
        } catch (e) {
            throw e;
        }
    },
);

/**
 * Action Get
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        loginRequired: false,
        middlewares: [BasicAuth(Permission['permissionServerByeR'])],
    },
    async (data): Promise<OutputR> => {
        try {
            setTimeout(() => {
                process.exit(1);
            }, 0);

            return 'bye';
        } catch (e) {
            throw e;
        }
    },
);
