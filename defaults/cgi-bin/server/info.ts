import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';

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
            let info: object = require('workspace/package.json');
            return `${info['formerDescription']}_v${info['formerVersion']}`;
        } catch (e) {
            throw e;
        }
    },
);
