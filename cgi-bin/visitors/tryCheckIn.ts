import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../core/cgi-package';


export interface Input {
    sessionId: string;
    otpCode: string;
}

export interface Output {
    sessionId: string;
}

export default new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement

    return {
        sessionId: "123",
    }
});
