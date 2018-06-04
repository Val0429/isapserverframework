import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
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
    requiredParameters: ["username"],
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Insert or Retrive
    var person: Person = await new Parse.Query(Person)
        .equalTo("username", data.parameters.username)
        .first();

    /// Error if not exists
    if (!person) throw Errors.throw(Errors.VisitorNotExists);

    var comp = new EventTryCheckIn({
        owner: data.user,
        relatedPerson: person,
    });
    await Events.save(comp);

    return {
        personId: person.id
    }
});
