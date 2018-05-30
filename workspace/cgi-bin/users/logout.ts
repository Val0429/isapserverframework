import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../../core/cgi-package';


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
