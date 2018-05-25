import * as Parse from 'parse/node';
import { registerSubclass, registerPrimaryKey } from '../helpers/parse-server/parse-helper';
import { IRole, IUser } from './../models/userRoles/userRoles.base';
import { Person } from './../models/userRoles/personRoles.base';
export * from './../models/userRoles/userRoles.base';
export * from './../models/userRoles/personRoles.base';


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
