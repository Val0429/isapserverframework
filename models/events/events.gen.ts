import * as Parse from 'parse/node';
import { registerSubclass, AsParseObject } from '../../helpers/Parse';
import { IEventEntity } from './definition/events.base';
import {} from './../events';


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


/// Event1: Login //////////////////////////////////
export interface IEventLogin extends IEventEntity {
    action: 1;
    
    /// owner: self User
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    
}
@registerSubclass() export class EventLogin extends AsParseObject("Event1")<IEventLogin> { constructor() { super({ action: 1 }) } }
////////////////////////////////////////////////////


/// Event2: Logout //////////////////////////////////
export interface IEventLogout extends IEventEntity {
    action: 2;
    
    /// owner: self User
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    
}
@registerSubclass() export class EventLogout extends AsParseObject("Event2")<IEventLogout> { constructor() { super({ action: 2 }) } }
////////////////////////////////////////////////////


/// Event3101: PickFloor //////////////////////////////////
export interface IEventPickFloor extends IEventEntity {
    action: 3101;
    
}
@registerSubclass() export class EventPickFloor extends AsParseObject("Event3101")<IEventPickFloor> { constructor() { super({ action: 3101 }) } }
////////////////////////////////////////////////////


/// Event3102: ScanIDCard //////////////////////////////////
export interface IEventScanIDCard extends IEventEntity {
    action: 3102;
    
}
@registerSubclass() export class EventScanIDCard extends AsParseObject("Event3102")<IEventScanIDCard> { constructor() { super({ action: 3102 }) } }
////////////////////////////////////////////////////


/// Event3188: RegistrationComplete //////////////////////////////////
export interface IEventRegistrationComplete extends IEventEntity {
    action: 3188;
    
}
@registerSubclass() export class EventRegistrationComplete extends AsParseObject("Event3188")<IEventRegistrationComplete> { constructor() { super({ action: 3188 }) } }
////////////////////////////////////////////////////


/// Event3201: VerifyOTPCode //////////////////////////////////
export interface IEventVerifyOTPCode extends IEventEntity {
    action: 3201;
    
}
@registerSubclass() export class EventVerifyOTPCode extends AsParseObject("Event3201")<IEventVerifyOTPCode> { constructor() { super({ action: 3201 }) } }
////////////////////////////////////////////////////


/// Event3202: FaceVerify //////////////////////////////////
export interface IEventFaceVerify extends IEventEntity {
    action: 3202;
    
}
@registerSubclass() export class EventFaceVerify extends AsParseObject("Event3202")<IEventFaceVerify> { constructor() { super({ action: 3202 }) } }
////////////////////////////////////////////////////


/// Event3288: CheckInComplete //////////////////////////////////
export interface IEventCheckInComplete extends IEventEntity {
    action: 3288;
    
}
@registerSubclass() export class EventCheckInComplete extends AsParseObject("Event3288")<IEventCheckInComplete> { constructor() { super({ action: 3288 }) } }
////////////////////////////////////////////////////


/// Event3601: FingerPrintVerify //////////////////////////////////
export interface IEventFingerPrintVerify extends IEventEntity {
    action: 3601;
    
    /// owner: self User
    pass: boolean;
    
}
@registerSubclass() export class EventFingerPrintVerify extends AsParseObject("Event3601")<IEventFingerPrintVerify> { constructor() { super({ action: 3601 }) } }
////////////////////////////////////////////////////
