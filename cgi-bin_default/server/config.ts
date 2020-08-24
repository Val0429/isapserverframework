import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import { BasicAuth } from 'helpers/middlewares';
import { permissionLogR } from 'workspace/define/userRoles/userPermission.define';

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
        middlewares: [BasicAuth(permissionLogR)],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        try {
            let configs: object = Object.keys(Config).map((value, index, array) => {
                return {
                    [value]: Config[value],
                };
            });

            return `<pre>${JSON.stringify(configs, null, 4)}</pre>`;
        } catch (e) {
            throw e;
        }
    },
);
