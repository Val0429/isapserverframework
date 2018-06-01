import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person,
    Events, EventRegistrationComplete,
} from './../../../core/cgi-package';

export interface Input {
    sessionId: string;
    personId: string;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId) throw Errors.throw(Errors.ParametersRequired, ["personId"]);

    var { personId } = data.parameters;

    /// Get Person
    var person: Person;
    try {
        person = await new Parse.Query(Person)
            .get(personId);
    } catch(reason) {
        /// Error if not exists
        throw Errors.throw(Errors.VisitorNotExists);
    }

    /// todo: Add to Role
    var comp = new EventRegistrationComplete({
        owner: data.user,
        relatedPerson: person,
    });
    await Events.save(comp);

    return;
});
