import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Events, EventLogout
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true
})
.post(async (data) => {
    /// Perform Logout
    data.session.destroy({ sessionToken: data.parameters.sessionId });

    var ev = new EventLogout({
        owner: data.user
    });
    await Events.save(ev);
});
