import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper
} from './../../../core/cgi-package';

import { Floors, IFloors } from './../../custom/models/floors';
import { Cameras, ICameras } from './../../custom/models/cameras';

var action = new Action({
    loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Administrator, RoleList.Kiosk]
});

const requiredParameters = ["floor", "image"];
const otherParameters = ["name"];
const acceptParameters = [...requiredParameters, ...otherParameters];
// Restful.CRUD<IFloors>(action, Floors, requiredParameters, acceptParameters);

Restful.C(action, Floors, requiredParameters, null, async (data) => {
    return {
        ...data,
        image: <Parse.File>await FileHelper.toParseFile(<any>data.image)
    }
});

Restful.R(action, Floors, null, async (data) => {
    var cameras = (await new Parse.Query(Cameras).equalTo("floor", data).find())
        .map( (camera) => ({
            ...camera.attributes,
            objectId: camera.id,
            floor: undefined,
            createdAt: undefined,
            updatedAt: undefined
        }));
    data.set("cameras", cameras);
    return data;
});

Restful.U(action, Floors, acceptParameters, null, async (data) => {
    return {
        ...data,
        image: data.image ? <Parse.File>await FileHelper.toParseFile(<any>data.image) : undefined
    }
});

Restful.D(action, Floors);

export default action;