import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventPickFloor,
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
    username: string;
}

export interface Output {
    personId: string;
}

export default new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.username) return Errors.throw(Errors.ParametersRequired, ["username"]);

    /// Insert or Retrive
    var person: Person = new Person({
        username: data.parameters.username
    });
    var { object: person, status } = await person.fetchOrInsert();

    return {
        personId: person.id
    }
});
