import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import * as Path from 'path';

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
    {},
    async (): Promise<OutputR> => {
        try {
            let server: string = Path.dirname(require.main.filename);

            return `${server.replace(/\\/gi, '/')}/`;
        } catch (e) {
            throw e;
        }
    },
);
