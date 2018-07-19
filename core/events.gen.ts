import * as Parse from 'parse/node';
import { registerSubclass, ParseObject, Omit } from 'helpers/parse-server/parse-helper';
import { Events, IEvents, IEvent } from 'models/events/events.base';
export * from 'models/events/events.base';


import { Floors } from 'workspace/custom/models/index';
export * from 'workspace/custom/models/index';


export enum EventList {
    EventLogin = "1",
    EventLogout = "2",
    EventConfigChanged = "101",
    EventTryRegister = "3601",
    EventPickFloor = "3602",
    EventScanIDCard = "3603",
    EventRegistrationComplete = "3688",
    EventTryCheckIn = "3701",
    EventFaceVerifyResult = "3702",
    EventDoneCheckIn = "3788"
}


export type EventType<T> =
    T extends "1" ? EventLogin :
    T extends "2" ? EventLogout :
    T extends "101" ? EventConfigChanged :
    T extends "3601" ? EventTryRegister :
    T extends "3602" ? EventPickFloor :
    T extends "3603" ? EventScanIDCard :
    T extends "3688" ? EventRegistrationComplete :
    T extends "3701" ? EventTryCheckIn :
    T extends "3702" ? EventFaceVerifyResult :
    T extends "3788" ? EventDoneCheckIn :
    never;

export type EventsType<T> =
    T extends "1" ? Events<IEvents<IEventLogin>> :
    T extends "2" ? Events<IEvents<IEventLogout>> :
    T extends "101" ? Events<IEvents<IEventConfigChanged>> :
    T extends "3601" ? Events<IEvents<IEventTryRegister>> :
    T extends "3602" ? Events<IEvents<IEventPickFloor>> :
    T extends "3603" ? Events<IEvents<IEventScanIDCard>> :
    T extends "3688" ? Events<IEvents<IEventRegistrationComplete>> :
    T extends "3701" ? Events<IEvents<IEventTryCheckIn>> :
    T extends "3702" ? Events<IEvents<IEventFaceVerifyResult>> :
    T extends "3788" ? Events<IEvents<IEventDoneCheckIn>> :
    never;


/// EventEventList.EventLogin: Login //////////////////////////////////
export interface IEventLogin extends IEvent {
    action: EventList.EventLogin;
        
    /**
    * owner: self User
    */
    owner: Parse.User;
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    target?: Parse.User;
    
}
@registerSubclass() export class EventLogin extends ParseObject<IEventLogin> { constructor(data?: Omit<IEventLogin, 'action'>) { super({ action: EventList.EventLogin, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventLogout: Logout //////////////////////////////////
export interface IEventLogout extends IEvent {
    action: EventList.EventLogout;
        
    /// owner: self User
    /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    
}
@registerSubclass() export class EventLogout extends ParseObject<IEventLogout> { constructor(data?: Omit<IEventLogout, 'action'>) { super({ action: EventList.EventLogout, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventConfigChanged: ConfigChanged //////////////////////////////////
export interface IEventConfigChanged extends IEvent {
    action: EventList.EventConfigChanged;
        
    key: string;
    value: any;
    
}
@registerSubclass() export class EventConfigChanged extends ParseObject<IEventConfigChanged> { constructor(data?: Omit<IEventConfigChanged, 'action'>) { super({ action: EventList.EventConfigChanged, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventTryRegister: TryRegister //////////////////////////////////
export interface IEventTryRegister extends IEvent {
    action: EventList.EventTryRegister;
        
}
@registerSubclass() export class EventTryRegister extends ParseObject<IEventTryRegister> { constructor(data?: Omit<IEventTryRegister, 'action'>) { super({ action: EventList.EventTryRegister, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventPickFloor: PickFloor //////////////////////////////////
export interface IEventPickFloor extends IEvent {
    action: EventList.EventPickFloor;
        
    /**
    * Floors object pick by Person.
    */
    floor: Floors;
    
}
@registerSubclass() export class EventPickFloor extends ParseObject<IEventPickFloor> { constructor(data?: Omit<IEventPickFloor, 'action'>) { super({ action: EventList.EventPickFloor, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventScanIDCard: ScanIDCard //////////////////////////////////
export interface IEventScanIDCard extends IEvent {
    action: EventList.EventScanIDCard;
        
    /**
    * Extracted info from ID Card.
    */
    name: string;
    birthdate: string;
    idnumber: string;
    image: Parse.File[];
    
}
@registerSubclass() export class EventScanIDCard extends ParseObject<IEventScanIDCard> { constructor(data?: Omit<IEventScanIDCard, 'action'>) { super({ action: EventList.EventScanIDCard, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventRegistrationComplete: RegistrationComplete //////////////////////////////////
export interface IEventRegistrationComplete extends IEvent {
    action: EventList.EventRegistrationComplete;
        
}
@registerSubclass() export class EventRegistrationComplete extends ParseObject<IEventRegistrationComplete> { constructor(data?: Omit<IEventRegistrationComplete, 'action'>) { super({ action: EventList.EventRegistrationComplete, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventTryCheckIn: TryCheckIn //////////////////////////////////
export interface IEventTryCheckIn extends IEvent {
    action: EventList.EventTryCheckIn;
        
}
@registerSubclass() export class EventTryCheckIn extends ParseObject<IEventTryCheckIn> { constructor(data?: Omit<IEventTryCheckIn, 'action'>) { super({ action: EventList.EventTryCheckIn, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventFaceVerifyResult: FaceVerifyResult //////////////////////////////////
export interface IEventFaceVerifyResult extends IEvent {
    action: EventList.EventFaceVerifyResult;
        
    /**
    * Verified face image and final result.
    */
    image: Parse.File;
    result: boolean;
    
}
@registerSubclass() export class EventFaceVerifyResult extends ParseObject<IEventFaceVerifyResult> { constructor(data?: Omit<IEventFaceVerifyResult, 'action'>) { super({ action: EventList.EventFaceVerifyResult, ...data }) } }
////////////////////////////////////////////////////


/// EventEventList.EventDoneCheckIn: DoneCheckIn //////////////////////////////////
export interface IEventDoneCheckIn extends IEvent {
    action: EventList.EventDoneCheckIn;
        
    /**
    * Check-in final result.
    */
    result: boolean;
    
}
@registerSubclass() export class EventDoneCheckIn extends ParseObject<IEventDoneCheckIn> { constructor(data?: Omit<IEventDoneCheckIn, 'action'>) { super({ action: EventList.EventDoneCheckIn, ...data }) } }
////////////////////////////////////////////////////


import { waitServerReady } from './pending-tasks';
import { Config } from './config.gen';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { Subject } from 'rxjs';
import { retrievePrimaryClass } from 'helpers/parse-server/parse-helper';
import { promisify } from 'bluebird';

export var EventSubjects: {
    EventLogin: Subject<ParseObject<IEventLogin>>;
    EventLogout: Subject<ParseObject<IEventLogout>>;
    EventConfigChanged: Subject<ParseObject<IEventConfigChanged>>;
    EventTryRegister: Subject<ParseObject<IEventTryRegister>>;
    EventPickFloor: Subject<ParseObject<IEventPickFloor>>;
    EventScanIDCard: Subject<ParseObject<IEventScanIDCard>>;
    EventRegistrationComplete: Subject<ParseObject<IEventRegistrationComplete>>;
    EventTryCheckIn: Subject<ParseObject<IEventTryCheckIn>>;
    EventFaceVerifyResult: Subject<ParseObject<IEventFaceVerifyResult>>;
    EventDoneCheckIn: Subject<ParseObject<IEventDoneCheckIn>>
} = {
    EventLogin: new Subject<ParseObject<IEventLogin>>(),
    EventLogout: new Subject<ParseObject<IEventLogout>>(),
    EventConfigChanged: new Subject<ParseObject<IEventConfigChanged>>(),
    EventTryRegister: new Subject<ParseObject<IEventTryRegister>>(),
    EventPickFloor: new Subject<ParseObject<IEventPickFloor>>(),
    EventScanIDCard: new Subject<ParseObject<IEventScanIDCard>>(),
    EventRegistrationComplete: new Subject<ParseObject<IEventRegistrationComplete>>(),
    EventTryCheckIn: new Subject<ParseObject<IEventTryCheckIn>>(),
    EventFaceVerifyResult: new Subject<ParseObject<IEventFaceVerifyResult>>(),
    EventDoneCheckIn: new Subject<ParseObject<IEventDoneCheckIn>>()
};

waitServerReady(async () => {
    let { ip, port, collection } = Config.mongodb;
    const url = `mongodb://${ip}:${port}`;
    let client = await MongoClient.connect(url);
    let db = client.db(collection);

    let events = ['EventLogin','EventLogout','EventConfigChanged','EventTryRegister','EventPickFloor','EventScanIDCard','EventRegistrationComplete','EventTryCheckIn','EventFaceVerifyResult','EventDoneCheckIn'];
    for (let event of events) {
        var instance = db.collection(event);
        var stream = instance.watch();
        stream.on("change", (change) => {
            if (change.operationType !== 'insert') return;
            var type = retrievePrimaryClass(event);
            var rtn: any = new type();
            rtn.id = change.documentKey._id;
            EventSubjects[event].next(rtn);
        });
    }
});
