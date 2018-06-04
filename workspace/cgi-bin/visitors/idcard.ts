import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
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
    postSizeLimit: 1024*1024*100,   /// 100MB
    requiredParameters: ["personId"],
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    var { name, birthdate, idnumber, image } = data.parameters;

    /// Get Person
    var person: Person;
    try {
        person = await new Parse.Query(Person)
            .get(data.parameters.personId);
    } catch(reason) {
        /// Error if not exists
        throw Errors.throw(Errors.VisitorNotExists);
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
