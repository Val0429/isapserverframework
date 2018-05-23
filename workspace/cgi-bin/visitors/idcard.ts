import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string[];
    name: string;
    birthdate: string;
    idnumber: string;
    image: Parse.File | Parse.File[];
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement

    return;
});
