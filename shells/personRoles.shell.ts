import { shellWriter, autoPad } from './../helpers/shells/shell-writer';

var tHeader = `
import * as Parse from 'parse/node';
import { registerSubclass, AsParseObject, registerPrimaryKey } from '../helpers/parse-server/parse-helper';
import { IRole, IUser } from './../models/userRoles/userRoles.base';
export * from './../models/userRoles/userRoles.base';

export interface IPerson<T> extends IUser<T> {}
@registerSubclass()
@registerPrimaryKey("username")
export class Person<T = any> extends AsParseObject("Person")<IPerson<T>> {}

export interface IPersonRole extends IRole {
    people: Parse.Relation<PersonRole, Person>;
    roles: Parse.Relation<PersonRole, PersonRole>;
}
export interface PersonRole {
    relation<T extends keyof IPersonRole>(relation: T);
}
@registerSubclass() export class PersonRole extends AsParseObject("PersonRole")<IPersonRole & IRole> {
    getRoles(): Parse.Relation<this, PersonRole> {
        return <any>this.relation("roles");
    }
    getPeople(): Parse.Relation<this, Person> {
        return <any>this.relation("people");
    }
}
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

function main(events: Array<[number, string, string] | [number, string]>): string {
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
const customDefPath = `${__dirname}/../workspace/config/userRoles/personRoles.define.ts`;

// var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';

shellWriter(
    [tmplPath, customDefPath],
    genFilePath,
    () => {
        var merged = [/*...events,*/ ...cevents];
        fs.writeFileSync(genFilePath, main(merged), "UTF-8");
        console.log("<Generated> PersonRole file updated!");        
    }
);