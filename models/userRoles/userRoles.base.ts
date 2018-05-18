import * as Parse from 'parse/node';

export interface IRole {
    name: string;
}

export interface IUser<T> {
    username: string;
    password: string;
    email?: string;
    data?: T;
}