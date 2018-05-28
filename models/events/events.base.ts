import * as Parse from 'parse/node';
import { Person } from './../userRoles/personRoles.base';
import { ParseObject, registerSubclass } from './../../helpers/parse-server/parse-helper';

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

export interface IEvents {
    action: number;
    owner: Parse.User;
    relatedPerson: Person;
    entity: ParseObject<IEventEntity>;
}

@registerSubclass() export class Events extends ParseObject<IEvents> {
    static async save(event: ParseObject<IEventEntity>): Promise<void> {
        if (!event.isNew) throw "currently doesn't support save of not new object.";
        /// save into specific Event
        await event.save();
        /// save into Events
        var evt = new Events({
            action: event.getValue("action"),
            entity: event,
            owner: event.getValue("owner"),
            relatedPerson: event.getValue("relatedPerson")
        });
        await evt.save();
    }
}
