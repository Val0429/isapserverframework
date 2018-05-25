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


export enum PersonRoleList {
    VIP = "0",
    General = "1",
    Blacklist = "2"
}


export type PersonType<T extends PersonRoleList> =
    T extends "0" ? IPersonVIP :
    T extends "1" ? IPersonGeneral :
    T extends "2" ? IPersonBlacklist :
    never;


/// UserVIP: 0 ///////////////////////////////////
export interface IPersonVIPData {
        
    /**
    * VIP Role.
    */
    
}
export type IPersonVIP = Person<IPersonVIPData>;
////////////////////////////////////////////////////


/// UserGeneral: 1 ///////////////////////////////////
export interface IPersonGeneralData {
        
}
export type IPersonGeneral = Person<IPersonGeneralData>;
////////////////////////////////////////////////////


/// UserBlacklist: 2 ///////////////////////////////////
export interface IPersonBlacklistData {
        
}
export type IPersonBlacklist = Person<IPersonBlacklistData>;
////////////////////////////////////////////////////
