import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../../core/cgi-package';

import { Floors } from './../../custom/models/floors';

export interface Input {
    sessionId: string;
}

export interface FloorUnit {
    objectId: string;
    floor: number;
    unitNo: string;
    phone: string[];
}

export type Output = FloorUnit[];

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.get(async (data) => {
    var floors = await new Parse.Query(Floors)
        .find();

    return floors;
});
