import {
    express, Request, Response, Router, WebSocket,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventScanIDCard, FileHelper
} from './../../../core/cgi-package';

export interface Input {
    sessionId: string;
    personId: string;

    name: string;
    birthdate: string;
    idnumber: string;
    image: string[];
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId) return Errors.throw(Errors.ParametersRequired, ["personId"]);

    var { name, birthdate, idnumber, image } = data.parameters;

    /// Get Person
    var person: Person;
    try {
        person = await new Parse.Query(Person)
            .get(data.parameters.personId);
    } catch(reason) {
        /// Error if not exists
        return Errors.throw(Errors.VisitorNotExists);
    }

    var comp = new EventScanIDCard({
        owner: data.user,
        relatedPerson: person,

        name, birthdate, idnumber,
        image: await FileHelper.toParseFile(image)
    });
    await Events.save(comp);

    return;
});
