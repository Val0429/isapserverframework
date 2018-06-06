import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, IInputPaging, IOutputPaging, ActionCallback,
    omitObject
} from './../../../core/cgi-package';

import { Floors, IFloors } from './../../custom/models/floors';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.Kiosk]
});


/// C : create floors //////////
export interface InputPost extends IFloors {
    sessionId: string;
}
type OutputPost = Floors;
// action.post<InputPost>({
//     requiredParameters: ["floor", "phone", "unitNo"],
// }, async (data) => {
//     var floor = new Floors({
//         floor: data.parameters.floor,
//         phone: data.parameters.phone,
//         unitNo: data.parameters.unitNo,
//     });
//     await floor.save();

//     return floor;

// });

action.post<InputPost, OutputPost>({
    requiredParameters: ["floor", "phone", "unitNo"],
}, RestfulC(Floors, ["floor", "phone", "unitNo"]));

function RestfulC<T extends Parse.Object>(type: new(...args: any[])=> T, keys: string[]) {
    return async <U>(data: U): Promise<T> => {
        var o = new type(omitObject((<any>data).parameters, keys));
        await o.save();
        return o;
    }
}

////////////////////////////////

/// R : get floors /////////////
export interface InputGet extends IInputPaging {
    sessionId: string;
}
export type OutputGet = IOutputPaging<Floors[]>;

// action.get<InputGet, OutputGet>(async (data) => {
//     var page = +(data.parameters.page || 1);
//     var pageSize = +(data.parameters.pageSize || 20);

//     var floors = await new Parse.Query(Floors)
//         .limit(pageSize)
//         .skip( (page-1) * pageSize )
//         .find();

//     var total = await new Parse.Query(Floors).count();
//     var totalPages = Math.ceil(total / pageSize);

//     return {
//         page, pageSize,
//         total, totalPages,
//         results: floors
//     }
// });

action.get<InputGet, OutputGet>(RestfulR(Floors));

function RestfulR<T extends Parse.Object>(type: new(...args: any[])=> T) {
    return async <U>(data: U): Promise<IOutputPaging<T[]>> => {
        var param = (<any>data).parameters;
        var page = +(param.page || 1);
        var pageSize = +(param.pageSize || 20);
        var o = await new Parse.Query(type)
            .limit(pageSize)
            .skip( (page-1) * pageSize )
            .find();
        var total = await new Parse.Query(Floors).count();
        var totalPages = Math.ceil(total / pageSize);
        return {
            page, pageSize,
            total, totalPages,
            results: o
        }
    }
}
////////////////////////////////

/// U : update floors //////////
export interface InputPut extends IFloors {
    sessionId: string;

    objectId: string;
}
type OutputPut = Floors;
// action.put<InputPut, OutputPut>({
//     requiredParameters: ["objectId"],
// }, async (data) => {
//     var floor = await new Parse.Query(Floors)
//         .get(data.parameters.objectId);

//     await floor.save( omitObject(data.parameters, ["floor", "phone", "unitNo"]) );
//     return floor;
// });
action.put<InputPut, OutputPut>({
    requiredParameters: ["objectId"],
}, RestfulU(Floors, ["floor", "phone", "unitNo"]));

function RestfulU<T extends Parse.Object>(type: new(...args: any[])=> T, keys: string[]) {
    return async <U>(data: U): Promise<T> => {
        var param = (<any>data).parameters;
        var o = await new Parse.Query(type)
            .get(param.objectId);
        await o.save( omitObject(param, keys) );
        return o;
    }
}
////////////////////////////////

/// D : delete floors //////////
export interface InputDelete extends IFloors {
    sessionId: string;

    objectId: string;
}
type OutputDelete = Floors;
// action.delete<InputDelete>({
//     requiredParameters: ["objectId"],
// }, async (data) => {
//     var floor = await new Parse.Query(Floors)
//         .get(data.parameters.objectId);
//     await floor.destroy();

//     return;
// });
action.delete<InputDelete, OutputDelete>({
    requiredParameters: ["objectId"],
}, RestfulD(Floors));

function RestfulD<T extends Parse.Object>(type: new(...args: any[])=> T) {
    return async <U>(data: U): Promise<T> => {
        var param = (<any>data).parameters;
        var o = await new Parse.Query(type)
            .get(param.objectId);
        await o.destroy();
        return o;
    }
}
////////////////////////////////

export default action;