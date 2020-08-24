import { Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import {} from 'helpers';
import * as Rx from 'rxjs';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action WebSocket
 */
action.ws(
    {
        permission: [],
    },
    async (data) => {
        let _socket: Socket = data.socket;

        let stop$: Rx.Subject<{}> = new Rx.Subject();

        _socket.io.on('close', () => {
            stop$.next();
        });
    },
);
