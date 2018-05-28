import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventDoneCheckIn
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
    personId: string;
    result: boolean;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId) return Errors.throw(Errors.ParametersRequired, ["personId"]);

    var { personId, result } = data.parameters;

    /// Get Person
    var person: Person = await new Parse.Query(Person)
        .get(personId);

    /// Error if not exists
    if (!person) return Errors.throw(Errors.VisitorNotExists);

    var comp = new EventDoneCheckIn({
        owner: data.user,
        relatedPerson: person,

        result,
    });
    await Events.save(comp);

    return;
});
