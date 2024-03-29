/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { shellWriter2, autoPad } from 'helpers/shells/shell-writer';

// import {
//     IEventLogin, IEventLogout
// } from './events';
var tHeader = `
/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IRole, IUser } from 'models/userRoles/userRoles.base';
export * from 'models/userRoles/userRoles.base';
import { {0} } from 'workspace/custom/models/index';
`;

// export enum EventList {
//     Administrator = "0",
//     Tenant = "1"
// }
var tEnum = `
export enum RoleList {
    {0}
}
`;

// export const RoleInterfaceLiteralList = {
//     99: "IUserSystemAdministrator",
//     0: "IUserAdministrator"
// }
var tLiteralList = `
export const RoleInterfaceLiteralList = {
    {0}
}
`;

// export type EventType<T> =
//     T extends "0" ? IUserAdministrator :
//     T extends "1" ? IUserTenant :
//     Parse.Object;
var tType = `
export type UserType<T> =
{0}
    never;
`;

// export type IUser{1} = ParseTypedGetterSetter<IUser<IUser{1}Data>> & Parse.User;
var tInterface = `
/// User{1}: {0} ///////////////////////////////////
export interface IUser{1}Data {
    {2}
}
export type IUser{1} = IUser<IUser{1}Data>;
////////////////////////////////////////////////////
`;

var tPartial = `export type PartialIUser{0} = Partial<IUser{0}>;
export type PartialIUser{0}Data = Partial<IUser{0}Data>;`;


function main(events: Array<[number, string, string, string[]] | [number, string, string] | [number, string]>): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    var tmp = [];
    for (var event of events) {
        if (event[3]) {
            tmp = [...tmp, ...event[3] as any];
        }
    }
    tmp = tmp.filter( (a, b, c) => c.indexOf(a) === b );
    tmpstr.push(
        tHeader.replace("{0}", tmp.join(", "))
    );
    /////////////////////////////////////////////

    /// make enum ///////////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(`${event[1]} = "${event[0]}"`);
    }
    tmpstr.push(
        tEnum.replace("{0}", tmp.join(",\r\n    "))
    );
    /////////////////////////////////////////////

    /// make literal list ///////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(`"${event[0]}": "IUser${event[1]}"`);
    }
    tmpstr.push(
        tLiteralList.replace("{0}", tmp.join(",\r\n    "))
    );
    /////////////////////////////////////////////

    /// make type ///////////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(
            `    T extends "{0}" ? IUser{1} :`.replace("{0}", event[0].toString())
                                        .replace("{1}", event[1])
            );
    }
    tmpstr.push(
        tType.replace("{0}", tmp.join("\r\n"))
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    for (var event of events) {
        var attrs = <any>event[2] || '';
        attrs = autoPad(attrs, 4);
        tmp.push(
            tInterface.replace(/\{0\}/g, event[0].toString())
                      .replace(/\{1\}/g, event[1])
                      .replace(/\{2\}/g, attrs)
        );
    }
    tmpstr.push(tmp.join("\r\n"));
    /////////////////////////////////////////////

    // make partial /////////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(
            tPartial.replace(/\{0\}/g, event[1])
        );
    }
    tmpstr.push(tmp.join("\r\n"));
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/userRoles.gen.ts`;
const tmplPath = `${__dirname}/userRoles.shell.ts`;
// const defPath = `${__dirname}/../models/userRoles/userRoles.define.ts`;
const customDefPath = `${__dirname}/../workspace/define/userRoles/userRoles.define.ts`;

// var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';
import { Log } from 'helpers/utility';

// shellWriter(
//     [tmplPath, customDefPath],
//     genFilePath,
//     () => {
//         var merged = [/*...events,*/ ...cevents];
//         fs.writeFileSync(genFilePath, main(merged), "UTF-8");
//     }
// );

shellWriter2(
    genFilePath,
    main([...cevents]),
    () => {
        Log.Info("Code Generator", "UserRole file updated!");
    }
);

