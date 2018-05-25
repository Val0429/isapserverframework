import * as Parse from 'parse/node';
import { Person } from './../userRoles/personRoles.base';

/// Base
export interface IEvent<T = IEventEntity, U = IEventEntity> {
    actions: number | number[];
    owner: Parse.User;
    target?: Parse.User;
    entities: IEventEntity | IEventEntity[];
}

export interface IEventEntity {
    action: number;
    /**
     * Owner of this event, current user.
     */
    owner: Parse.User;
    /**
     * User that being target of this event.
     */
    target?: Parse.User;
    /**
     * Parent event related to this.
     */
    parent?: IEventEntity;
    /**
     * Person related to this event.
     */
    relatedPerson?: Person;
}
