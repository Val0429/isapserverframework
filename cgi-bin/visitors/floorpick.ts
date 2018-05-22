import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../core/cgi-package';

import { FloorUnit } from './../floors/index';

export interface Input {
    sessionId: string[];
    unit: FloorUnit;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement

    return;
});
