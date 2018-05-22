import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
} from './../../core/cgi-package';


export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true
})
.ws(async (data) => {
    /// Check param requirement
    console.log('is it here?', data.parameters);
    /// Perform Logout
    //data.session.destroy({ sessionToken: data.parameters.sessionId });
});
