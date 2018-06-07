import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful,
} from './../../../core/cgi-package';

import { Floors, IFloors } from './../../custom/models/floors';

import * as csv from 'fast-csv';

export interface InputPost {
    sessionId: string;
    data: string;
}

var action = new Action<InputPost>({
    loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Administrator, RoleList.Kiosk]
})
.post( (data) => {
    var content = new Buffer(data.parameters.data, 'base64').toString();
    csv.fromString(content)
        .on("data", (data) => {
            if ((<any>data[0]).length === 0) return;
            console.log(data);
        })
        .on("end", () => {
            console.log("end");
        });
    return;
});

export default action;