import * as Parse from 'parse/node';
import { registerSubclass, AsParseObject } from '../../../helpers/Parse';

/// Base
export interface IEvent {
    actions: number | number[];
    owner: Parse.User;
    target?: Parse.User;
    entities: IEventEntity | IEventEntity[];
}

export interface IEventEntity {
    action: number;
    owner: Parse.User;
    target?: Parse.User;
}
