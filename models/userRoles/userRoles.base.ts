import { RoleList } from 'core/userRoles.gen';

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
    roles: RoleList[];
}