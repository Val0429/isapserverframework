/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IUser, IRole } from './userRoles.base';
import { ParseObject, registerSubclass, registerPrimaryKey } from 'helpers/parse-server/parse-helper';

export interface IPerson<T> extends IUser<T> {}
@registerSubclass()
@registerPrimaryKey("username")
export class Person<T = any> extends ParseObject<IPerson<T>> {}

// export interface IPersonRole extends IRole {
//     people: Parse.Relation<PersonRole, Person>;
//     roles: Parse.Relation<PersonRole, PersonRole>;
// }
// export interface PersonRole {
//     relation<T extends keyof IPersonRole>(relation: T);
// }
// @registerSubclass() export class PersonRole extends ParseObject<IPersonRole & IRole> {
//     getRoles(): Parse.Relation<this, PersonRole> {
//         return <any>this.relation("roles");
//     }
//     getPeople(): Parse.Relation<this, Person> {
//         return <any>this.relation("people");
//     }
// }

export interface IPersonRole extends IRole {
    people: any;
    roles: any;
}
// export interface PersonRole {
//     relation<T extends keyof IPersonRole>(relation: T);
// }
@registerSubclass() export class PersonRole extends ParseObject<any> {
    getRoles(): any {
        return <any>this.relation("roles");
    }
    getPeople(): any {
        return <any>this.relation("people");
    }
}