import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventTryCheckIn
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
    var person: Person = await new Parse.Query(Person)
        .equalTo("username", data.parameters.username)
        .first();

    /// Error if not exists
    if (!person) return Errors.throw(Errors.VisitorNotExists);

    var comp = new EventTryCheckIn({
        owner: data.user,
        relatedPerson: person,
    });
    await Events.save(comp);

    return {
        personId: person.id
    }
});
