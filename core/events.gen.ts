import * as Parse from 'parse/node';
import { registerSubclass, AsParseObject, Omit } from '../helpers/parse-server/parse-helper';
import { IEventEntity } from './../models/events/events.base';
export * from './../models/events/events.base';


export enum EventList {
    Login = 1,
    Logout = 2,
    PickFloor = 3101,
    ScanIDCard = 3102,
    RegistrationComplete = 3188,
    VerifyOTPCode = 3201,
    FaceVerify = 3202,
    CheckInComplete = 3288,
    FingerPrintVerify = 3601
}


export type EventType<T> =
    T extends 1 ? EventLogin :
    T extends 2 ? EventLogout :
    T extends 3101 ? EventPickFloor :
    T extends 3102 ? EventScanIDCard :
    T extends 3188 ? EventRegistrationComplete :
    T extends 3201 ? EventVerifyOTPCode :
    T extends 3202 ? EventFaceVerify :
    T extends 3288 ? EventCheckInComplete :
    T extends 3601 ? EventFingerPrintVerify :
    Parse.Object;


/// Event1: Login //////////////////////////////////
export interface IEventLogin extends IEventEntity {
    action: 1;
    
    /**
    * owner: self User
    */
    owner: Parse.User;
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    target?: Parse.User;
    
}
@registerSubclass() export class EventLogin extends AsParseObject("Event1")<IEventLogin> { constructor(data?: Omit<IEventLogin, 'action'>) { super({ action: 1, ...data }) } }
////////////////////////////////////////////////////


/// Event2: Logout //////////////////////////////////
export interface IEventLogout extends IEventEntity {
    action: 2;
    
    /// owner: self User
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    
}
@registerSubclass() export class EventLogout extends AsParseObject("Event2")<IEventLogout> { constructor(data?: Omit<IEventLogout, 'action'>) { super({ action: 2, ...data }) } }
////////////////////////////////////////////////////


/// Event3101: PickFloor //////////////////////////////////
export interface IEventPickFloor extends IEventEntity {
    action: 3101;
    
}
@registerSubclass() export class EventPickFloor extends AsParseObject("Event3101")<IEventPickFloor> { constructor(data?: Omit<IEventPickFloor, 'action'>) { super({ action: 3101, ...data }) } }
////////////////////////////////////////////////////


/// Event3102: ScanIDCard //////////////////////////////////
export interface IEventScanIDCard extends IEventEntity {
    action: 3102;
    
}
@registerSubclass() export class EventScanIDCard extends AsParseObject("Event3102")<IEventScanIDCard> { constructor(data?: Omit<IEventScanIDCard, 'action'>) { super({ action: 3102, ...data }) } }
////////////////////////////////////////////////////


/// Event3188: RegistrationComplete //////////////////////////////////
export interface IEventRegistrationComplete extends IEventEntity {
    action: 3188;
    
}
@registerSubclass() export class EventRegistrationComplete extends AsParseObject("Event3188")<IEventRegistrationComplete> { constructor(data?: Omit<IEventRegistrationComplete, 'action'>) { super({ action: 3188, ...data }) } }
////////////////////////////////////////////////////


/// Event3201: VerifyOTPCode //////////////////////////////////
export interface IEventVerifyOTPCode extends IEventEntity {
    action: 3201;
    
}
@registerSubclass() export class EventVerifyOTPCode extends AsParseObject("Event3201")<IEventVerifyOTPCode> { constructor(data?: Omit<IEventVerifyOTPCode, 'action'>) { super({ action: 3201, ...data }) } }
////////////////////////////////////////////////////


/// Event3202: FaceVerify //////////////////////////////////
export interface IEventFaceVerify extends IEventEntity {
    action: 3202;
    
}
@registerSubclass() export class EventFaceVerify extends AsParseObject("Event3202")<IEventFaceVerify> { constructor(data?: Omit<IEventFaceVerify, 'action'>) { super({ action: 3202, ...data }) } }
////////////////////////////////////////////////////


/// Event3288: CheckInComplete //////////////////////////////////
export interface IEventCheckInComplete extends IEventEntity {
    action: 3288;
    
}
@registerSubclass() export class EventCheckInComplete extends AsParseObject("Event3288")<IEventCheckInComplete> { constructor(data?: Omit<IEventCheckInComplete, 'action'>) { super({ action: 3288, ...data }) } }
////////////////////////////////////////////////////


/// Event3601: FingerPrintVerify //////////////////////////////////
export interface IEventFingerPrintVerify extends IEventEntity {
    action: 3601;
    
    /// owner: self User
    pass: boolean;
    
}
@registerSubclass() export class EventFingerPrintVerify extends AsParseObject("Event3601")<IEventFingerPrintVerify> { constructor(data?: Omit<IEventFingerPrintVerify, 'action'>) { super({ action: 3601, ...data }) } }
////////////////////////////////////////////////////