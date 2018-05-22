import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../core/cgi-package';


export interface Input {
    sessionId: string[];
    otpCode: string;
    image: Parse.File;
    result: boolean;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement

    return;
});
