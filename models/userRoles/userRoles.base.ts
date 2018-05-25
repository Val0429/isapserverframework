export interface IRole {
    name: string;
}

export interface IUserData {
    image?: Parse.File[];
}

export interface IUser<T = {}> {
    username: string;
    password: string;
    email?: string;
    data?: T & IUserData;
}