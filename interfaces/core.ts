import * as Parse from 'parse/node';

import { registerSubclass, AsParseObject } from '../helpers/Parse';

export interface IRole {
    name: string;
}

export interface IUser {
    username: string;
    password: string;
    email?: string;
    data?: IUserHost | IUserVisitor | any;
}

export interface IUserHost {
    /** 樓層 */
    floor?: number;
    /** 公司名稱 */
    companyName: string;
    /** 聯絡人名稱 */
    contactPerson: string;
    /** 聯絡人號碼 */
    contactNumber: string;
}

export interface IUserVisitor {
    /** 訪客名稱 */
    name: string;
    // /** 訪客聯絡電話 (for VMS) */
    // contactNumber?: string;
    // /** 護照/身分證圖片 (for VMS) */
    // documentImage?: Parse.File;
    // /** 護照/身分證號碼 (for VMS) */
    // documentNumber?: string;
    // /** 訪客群組 */
    // groups?: IVisitorGroup[];
    // data?: any;
    // validStartDate: Date;
    // validEndDate: Date;
}

export interface IHostEvent {
    /** Host User */
    host: IUserHost;
    /** 訪客 */
    visitor: IUserVisitor;
    /** 本次的訪客名稱 */
    visitorName: string;
    /** 本次訪客的照片 */
    visitorAvatarImage?: Parse.File;
    /** 狀態 */
    status: string;
    /** 目的 */
    purpose: string;
    /** 通行人類型 (待移除) */
    visitorType?: string;
    /** 訪問時間，僅日期（開始） */
    visitFrom: Date;
    /** 訪問時間，僅日期（結束） */
    visitTo: Date;
    /** OTP Passcode */
    otpCode?: string;
}

export interface IVisitorGroup {
    name: string;
    sequence: number;
    watch: boolean;
}

// export enum EventList {
//     Login = 1,
//     Logout
// };
// interface EventListType {
//     [index: number/*EventList*/]: typeof Parse.Object;
// }
// var Events: EventListType = {};
// /// Event - Login /////////////////////////////////////////
// export interface IEvent {
//     action: Number;
//     owner: Parse.User;
//     target?: Parse.User;
//     entity: IEventEntity;
// }

// export interface IEventEntity {
//     owner: Parse.User;
//     target?: Parse.User;
// }

// export interface IEventLogin extends IEventEntity {}
// @registerSubclass() class EventLogin extends AsParseObject("EventLogin")<IEventLogin> {}
// Events[EventList.Login] = EventLogin;
///////////////////////////////////////////////////////////


// export type EventList =
//     'Login' | 'Logout'
//     ;
// type EventList = EventList & 'Logs';
// export type EventListType = {
//     [P in EventList]?: typeof Parse.Object;
// }
// var Events: EventListType = {};
// /// Event - Login /////////////////////////////////////////
// export interface IEvent {
//     action: EventList;
//     owner: Parse.User;
//     target?: Parse.User;
//     entity: IEventEntity;
// }

// export interface IEventEntity {
//     owner: Parse.User;
//     target?: Parse.User;
// }

// export interface IEventLogin extends IEventEntity {}
// @registerSubclass() class EventLogin extends AsParseObject("EventLogin")<IEventLogin> {}
// Events.Login = EventLogin;
// ///////////////////////////////////////////////////////////


// [
//     [1, "Login", "EventLogin"],
//     [2, "Logout", "EventLogout"]
// ]

// [
//     [1001, "Custom", "EventCustom"]
// ]

// =>
// enum EventListEnum {
//     Login = 1,
//     logout = 2,
// }
// interface EventListInterface {
//     Login: typeof EventLogin;
//     Logout: typeof EventLogout;
// }


// export var EventListEnum: {[index: number]: string} = {
//     1: "Login",
//     2: "Logout",
// };

// interface EventListInterface {
//     Login: typeof EventLogin;
// }

// var Events: EventListInterface = {};
// /// Event - Login /////////////////////////////////////////
// export interface IEvent {
//     action: number;
//     owner: Parse.User;
//     target?: Parse.User;
//     entity: IEventEntity;
// }

// export interface IEventEntity {
//     owner: Parse.User;
//     target?: Parse.User;
// }

// export interface IEventLogin extends IEventEntity {}
// @registerSubclass() class EventLogin extends AsParseObject("EventLogin")<IEventLogin> {}
// Events[EventListEnum.Login] = EventLogin;

// var tt = Events[EventListEnum.Login];
