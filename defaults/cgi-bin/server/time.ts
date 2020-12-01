import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { DateTimeService } from 'helpers';

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
            return DateTimeService.toString(new Date(), 'YYYY/MM/DD HH:mm:ss Z');
        } catch (e) {
            throw e;
        }
    },
);
