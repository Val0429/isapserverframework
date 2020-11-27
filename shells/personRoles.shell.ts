/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { shellWriter2, autoPad } from 'helpers/shells/shell-writer';

var tHeader = `
/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { registerSubclass, registerPrimaryKey } from 'helpers/parse-server/parse-helper';
import { IRole, IUser } from 'models/userRoles/userRoles.base';
import { Person } from 'models/userRoles/personRoles.base';
export * from 'models/userRoles/userRoles.base';
export * from 'models/userRoles/personRoles.base';
`;

// export enum PersonRoleList {
//     VIP = "0",
//     General = "1",
//     Blacklist = "2",
// }
var tEnum = `
export enum PersonRoleList {
    {0}
}
`;

// export type PersonType<T extends PersonRoleList> =
//     T extends "0" ? IPersonVIP :
//     T extends "1" ? IPersonGeneral :
//     T extends "2" ? IPersonBlacklist :
//     never;
var tType = `
export type PersonType<T extends PersonRoleList> =
{0}
    never;
`;


// export interface IPersonVIPData {}
// type IPersonVIP = Person<IPersonVIPData>;
// export interface IPersonGeneralData {}
// type IPersonGeneral = Person<IPersonGeneralData>;
var tInterface = `
/// User{1}: {0} ///////////////////////////////////
export interface IPerson{1}Data {
    {2}
}
export type IPerson{1} = Person<IPerson{1}Data>;
////////////////////////////////////////////////////
`;


import { Config } from 'models/define/userRoles/personRoles';
function main(events: Config[]): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+/, '')
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

    /// make type ///////////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(
            `    T extends "{0}" ? IPerson{1} :`.replace("{0}", event[0].toString())
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

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/personRoles.gen.ts`;
const tmplPath = `${__dirname}/personRoles.shell.ts`;
// const defPath = `${__dirname}/../models/userRoles/userRoles.define.ts`;
const customDefPath = `${__dirname}/../workspace/define/userRoles/personRoles.define.ts`;

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
        Log.Info("Code Generator", "PersonRole file updated!");
    }
);

