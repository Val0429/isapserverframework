/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Person } from 'models/userRoles/personRoles.base';
import { ParseObject, registerSubclass, retrievePrimaryClass } from 'helpers/parse-server/parse-helper';
import { EventList, EventsType } from 'core/events.gen';
import { EnumConverter } from 'helpers/utility/get-enum-key';

/// Base
export interface IEvent {
    action: EventList;
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
    action: EventList;
    owner: Parse.User;
    relatedPerson: Person;
    entity: ParseObject<T>;
    data: any;
}

@registerSubclass() export class Events<T extends IEvents = IEvents> extends ParseObject<T> {
    static async save(event: ParseObject<IEvent>, data: object = {}): Promise<void> {
        if (!event.isNew) throw "currently doesn't support save of not new object.";
        /// save into specific Event
        await event.save();

        /// make token
        let className = event.className;
        var token = `${className}\$${event.id}`;

        /// save into Events
        var evt = new Events({
            action: event.getValue("action"),
            entity: <any>token,
            data: {
                [className]: data
            },
            owner: event.getValue("owner"),
            relatedPerson: event.getValue("relatedPerson")
        });
        await evt.save();
    }

    getValue<U extends keyof T>(key: U): T[U] {
        if (key == "entity") {
            /// parse token
            var token = super.get("entity");
            if (typeof(token) !== 'string') return token;
            var regex = /^([^$]+)\$(.+)$/;
            var [, className, objectId] = token.match(regex);
            var evt = new (retrievePrimaryClass(className))();
            evt.id = objectId;
            return <any>evt;
        }
        return super.getValue(key);
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

    /// Normal Style
    // var query = Events.Query.get();
    // var results = await query.find();
    // await Events.Query.tuner(results);
    // return ParseObject.toOutputJSON(results, Events.Query.filter);

    /// Paging Style
    // var query = Events.Query.get();
    // return Restful.Pagination(query, { paging: { } }, Events.Query.filter(), Events.Query.tuner());
    
    static Query = {
        get(): Parse.Query<Events> {
            return new Parse.Query(Events)
                .include("owner")
                .include("target" as any);
        },
        tuner() {
            return async (data: Events[]): Promise<Events[]> => {
                var promises = data.map( (event) => {
                    var ins = event.getValue("entity");
                    event.setValue("entity", ins);
                    return ins.fetch();
                });
                await Promise.all(promises);
                return data;
            }
        },
        filter() {
            return {
                action: EnumConverter(EventList),
                entity: {
                    action: false,
                    owner: false,
                    createdAt: false,
                    updatedAt: false
                },
                owner: {
                    roles: false,
                    ACL: false,
                    createdAt: false,
                    updatedAt: false
                }
            }
        }
    }
}
