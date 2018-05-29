import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventPickFloor, Floors,
} from './../../../core/cgi-package';

export interface Input {
    sessionId: string;
    personId: string;
    floorId: string;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId || !data.parameters.floorId) return Errors.throw(Errors.ParametersRequired, ["personId, floorId"]);

    /// get Person
    var person: Person;
    try {
        person = await new Parse.Query(Person)
            .get(data.parameters.personId);
    } catch(reason) {
        return Errors.throw(Errors.ParametersInvalid, ["personId"]);
    }

    /// get Floor
    var floor: Floors;
    try {
        floor = await new Parse.Query(Floors)
            .get(data.parameters.floorId);
    } catch(reason) {
        return Errors.throw(Errors.ParametersInvalid, ["floorId"]);
    }

    /// Log Event
    var event = new EventPickFloor({
        owner: data.user,
        relatedPerson: person,
        floor,
    });
    await Events.save(event);

    return;
});
