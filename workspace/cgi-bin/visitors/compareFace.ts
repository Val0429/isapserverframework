import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person,
    Events, FileHelper, EventList, EventsType, EventType
} from './../../../core/cgi-package';

import { Buffer } from 'buffer';
import FRS from './../../custom/services/frs-service';

export interface Input {
    sessionId: string;
    personId: string;
    image: string;
}

export interface Output {
    score: number;
}

export default new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Check param requirement
    if (!data.parameters.personId || !data.parameters.personId) throw Errors.throw(Errors.ParametersRequired, ["personId, image"]);

    var { personId, image } = data.parameters;

    /// Get Person
    var person: Person;
    try {
        person = await new Parse.Query(Person)
            .get(personId);
    } catch(reason) {
        /// Error if not exists
        throw Errors.throw(Errors.VisitorNotExists);
    }

    /// Get Person pre-saved image
    var events = await Events.fetchLast(EventList.ScanIDCard, person);
    var event = await events.getValue("entity").fetch();

    /// Send compare
    var score = 0;
    var imageFiles: Parse.File[] = event.getValue("image");
    for (var imageFile of imageFiles) {
        var res = await Parse.Cloud.httpRequest({ url: imageFile.url() });
        var b64image = res.buffer.toString('base64');
        var result = await FRS.compareFace(b64image, image);
        score = Math.max(score, result);
    }

    return { score };
});
