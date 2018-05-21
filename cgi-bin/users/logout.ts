import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
    loginRequired
} from './../../core/cgi-package';


export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true
})
.post(async (data) => {
    /// Check param requirement

    /// Perform Logout
    data.session.destroy({ sessionToken: data.parameters.sessionId });
});
