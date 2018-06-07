import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful,
} from './../../../core/cgi-package';

import { Floors, IFloors } from './../../custom/models/floors';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.Kiosk]
});

const requiredParameters = ["floor", "phone", "name", "unitNo"];
Restful.CRUD<IFloors>(action, Floors, requiredParameters);

export default action;