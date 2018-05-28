import * as Parse from 'parse/node';
import { registerSubclass, ParseObject, Omit } from '../helpers/parse-server/parse-helper';
import { IEventEntity } from './../models/events/events.base';
export * from './../models/events/events.base';


import { Floors } from './../workspace/models/index';
export * from './../workspace/models/index';


export enum EventList {
    Login = 1,
    Logout = 2,
    PickFloor = 3601,
    ScanIDCard = 3602,
    RegistrationComplete = 3688,
    TryCheckIn = 3701,
    FaceVerifyResult = 3702,
    DoneCheckIn = 3788
}


export type EventType<T> =
    T extends 1 ? EventLogin :
    T extends 2 ? EventLogout :
    T extends 3601 ? EventPickFloor :
    T extends 3602 ? EventScanIDCard :
    T extends 3688 ? EventRegistrationComplete :
    T extends 3701 ? EventTryCheckIn :
    T extends 3702 ? EventFaceVerifyResult :
    T extends 3788 ? EventDoneCheckIn :
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
@registerSubclass() export class EventLogin extends ParseObject<IEventLogin> { constructor(data?: Omit<IEventLogin, 'action'>) { super({ action: 1, ...data }) } }
////////////////////////////////////////////////////


/// Event2: Logout //////////////////////////////////
export interface IEventLogout extends IEventEntity {
    action: 2;
        
    /// owner: self User
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    
}
@registerSubclass() export class EventLogout extends ParseObject<IEventLogout> { constructor(data?: Omit<IEventLogout, 'action'>) { super({ action: 2, ...data }) } }
////////////////////////////////////////////////////


/// Event3601: PickFloor //////////////////////////////////
export interface IEventPickFloor extends IEventEntity {
    action: 3601;
        
    /**
    * Floors object pick by Person.
    */
    floor: Floors;
    
}
@registerSubclass() export class EventPickFloor extends ParseObject<IEventPickFloor> { constructor(data?: Omit<IEventPickFloor, 'action'>) { super({ action: 3601, ...data }) } }
////////////////////////////////////////////////////


/// Event3602: ScanIDCard //////////////////////////////////
export interface IEventScanIDCard extends IEventEntity {
    action: 3602;
        
}
@registerSubclass() export class EventScanIDCard extends ParseObject<IEventScanIDCard> { constructor(data?: Omit<IEventScanIDCard, 'action'>) { super({ action: 3602, ...data }) } }
////////////////////////////////////////////////////


/// Event3688: RegistrationComplete //////////////////////////////////
export interface IEventRegistrationComplete extends IEventEntity {
    action: 3688;
        
}
@registerSubclass() export class EventRegistrationComplete extends ParseObject<IEventRegistrationComplete> { constructor(data?: Omit<IEventRegistrationComplete, 'action'>) { super({ action: 3688, ...data }) } }
////////////////////////////////////////////////////


/// Event3701: TryCheckIn //////////////////////////////////
export interface IEventTryCheckIn extends IEventEntity {
    action: 3701;
        
}
@registerSubclass() export class EventTryCheckIn extends ParseObject<IEventTryCheckIn> { constructor(data?: Omit<IEventTryCheckIn, 'action'>) { super({ action: 3701, ...data }) } }
////////////////////////////////////////////////////


/// Event3702: FaceVerifyResult //////////////////////////////////
export interface IEventFaceVerifyResult extends IEventEntity {
    action: 3702;
        
}
@registerSubclass() export class EventFaceVerifyResult extends ParseObject<IEventFaceVerifyResult> { constructor(data?: Omit<IEventFaceVerifyResult, 'action'>) { super({ action: 3702, ...data }) } }
////////////////////////////////////////////////////


/// Event3788: DoneCheckIn //////////////////////////////////
export interface IEventDoneCheckIn extends IEventEntity {
    action: 3788;
        
}
@registerSubclass() export class EventDoneCheckIn extends ParseObject<IEventDoneCheckIn> { constructor(data?: Omit<IEventDoneCheckIn, 'action'>) { super({ action: 3788, ...data }) } }
////////////////////////////////////////////////////
