/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { RoleList } from 'core/userRoles.gen';
import { APIRoles } from 'models/customRoles';

export interface IRole {
    name: string;
}

export interface IUserData {
    image?: Parse.File[];
}

export interface IUser<T = {}> {
    username: string;
    /**
     * @uiHidden - true
     */
    password: string;
    /**
     * @uiHidden - true
     */
    email?: string;
    publicEmailAddress?: string;
    phone?: string;
    data: T & IUserData;
    roles: [RoleList, ...Array<RoleList>];
    apiRoles?: APIRoles[];

    /// innate use
    isDefault?: boolean;
}