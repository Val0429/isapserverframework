import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import * as Permission from 'workspace/define/userRoles/userPermission.define';

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
