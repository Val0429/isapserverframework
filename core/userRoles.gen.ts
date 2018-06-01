import * as Parse from 'parse/node';
import { registerSubclass, Omit, ParseTypedGetterSetter } from '../helpers/parse-server/parse-helper';
import { IRole, IUser } from './../models/userRoles/userRoles.base';
export * from './../models/userRoles/userRoles.base';


export enum RoleList {
    Administrator = "0",
    Tenant = "1",
    Visitor = "2",
    Kiosk = "3",
    SystemAdministrator = "99"
}


export type UserType<T> =
    T extends "0" ? IUserAdministrator :
    T extends "1" ? IUserTenant :
    T extends "2" ? IUserVisitor :
    T extends "3" ? IUserKiosk :
    T extends "99" ? IUserSystemAdministrator :
    never;


/// UserAdministrator: 0 ///////////////////////////////////
export interface IUserAdministratorData {
        
}
export type IUserAdministrator = ParseTypedGetterSetter<IUser<IUserAdministratorData>> & Parse.User;
////////////////////////////////////////////////////


/// UserTenant: 1 ///////////////////////////////////
export interface IUserTenantData {
        
    /**
    * Which floor this Tenant is in.
    */
    floor: number;
    /**
    * Tenant's company name.
    */
    companyName: string;
    /**
    * Tenant's contact person name.
    */
    contactPerson: string;
    /**
    * Tenant's contact phone number.
    */
    contactNumber: string;
    
}
export type IUserTenant = ParseTypedGetterSetter<IUser<IUserTenantData>> & Parse.User;
////////////////////////////////////////////////////


/// UserVisitor: 2 ///////////////////////////////////
export interface IUserVisitorData {
        
    /**
    * Name of this visitor.
    */
    name: string;
    
}
export type IUserVisitor = ParseTypedGetterSetter<IUser<IUserVisitorData>> & Parse.User;
////////////////////////////////////////////////////


/// UserKiosk: 3 ///////////////////////////////////
export interface IUserKioskData {
        
    /**
    * Name of this kiosk.
    */
    name: string;
    
}
export type IUserKiosk = ParseTypedGetterSetter<IUser<IUserKioskData>> & Parse.User;
////////////////////////////////////////////////////


/// UserSystemAdministrator: 99 ///////////////////////////////////
export interface IUserSystemAdministratorData {
        
}
export type IUserSystemAdministrator = ParseTypedGetterSetter<IUser<IUserSystemAdministratorData>> & Parse.User;
////////////////////////////////////////////////////
