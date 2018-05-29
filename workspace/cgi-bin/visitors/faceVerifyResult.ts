import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, config,
    Action, Errors, Person,
    Events, EventFaceVerifyResult, FileHelper
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
    personId: string;
    image: string;
    result: boolean;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId) return Errors.throw(Errors.ParametersRequired, ["personId"]);

    var { personId, image, result } = data.parameters;

    /// Get Person
    var person: Person = await new Parse.Query(Person)
        .get(personId);

    /// Error if not exists
    if (!person) return Errors.throw(Errors.VisitorNotExists);

    var comp = new EventFaceVerifyResult({
        owner: data.user,
        relatedPerson: person,

        image: await FileHelper.toParseFile(image),
        result,
    });
    await Events.save(comp);

    return;
});
