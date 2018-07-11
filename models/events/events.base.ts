import * as Parse from 'parse/node';
import { Person } from './../userRoles/personRoles.base';
import { ParseObject, registerSubclass, retrievePrimaryClass } from './../../helpers/parse-server/parse-helper';
import { EventList, EventsType } from './../../core/events.gen';

/// Base
// export interface IEvent<T = IEvent, U = IEvent> {
//     actions: number | number[];
//     owner: Parse.User;
//     target?: Parse.User;
//     entities: IEvent | IEvent[];
// }

export interface IEvent {
    action: string;
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
    parent?: IEvent;
    /**
     * Person related to this event.
     */
    relatedPerson?: Person;
}

export interface IEvents<T = IEvent> {
    action: string;
    owner: Parse.User;
    relatedPerson: Person;
    entity: ParseObject<T>;
}

@registerSubclass() export class Events<T extends IEvents = IEvents> extends ParseObject<T> {
    static async save(event: ParseObject<IEvent>, data: object = {}): Promise<void> {
        if (!event.isNew) throw "currently doesn't support save of not new object.";
        /// save into specific Event
        await event.save();

        /// make token
        var token = `${event.className}\$${event.id}`;

        /// save into Events
        var evt = new Events({
            action: event.getValue("action"),
            entity: <any>token,
            data,
            owner: event.getValue("owner"),
            relatedPerson: event.getValue("relatedPerson")
        });
        await evt.save();
    }

    static async fetchLast<T extends EventList>(action: T, person: Person): Promise<EventsType<T>> {
        var event;
        try {
            event = await new Parse.Query(Events)
                .equalTo("action", action)
                .equalTo("relatedPerson", person)
                .descending("createdAt")
                .first();
        } catch(reason) {
            return null;
        }
        return <any>event;
    }

    getValue<U extends keyof T>(key: U): T[U] {
        if (key == "entity") {
            /// parse token
            var token = super.get("entity");
            var regex = /^([^$]+)\$(.+)$/;
            var [, className, objectId] = token.match(regex);
            var evt = new (retrievePrimaryClass(className))();
            evt.id = objectId;
            return <any>evt;
        }
        return super.getValue(key);
    }
}
