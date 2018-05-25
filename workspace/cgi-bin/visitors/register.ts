import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors,
    Person,
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

    //var test = () => console.log(123);
    var test = null;
    (0 as any, test)();

    /// Insert or Retrive
    var person: Person = new Person({
        username: data.parameters.username
    });
    var { object: person, status } = await person.updateOrInsert(true);

    /// Error if exists?
    // if (status == "update") return Errors.throw(Errors.VisitorAlreadyExists);

    /// todo: Add to Role

    return {
        personId: person.id
    }
});
