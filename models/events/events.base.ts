import * as Parse from 'parse/node';

/// Base
export interface IEvent<T = IEventEntity, U = IEventEntity> {
    actions: number | number[];
    owner: Parse.User;
    target?: Parse.User;
    entities: IEventEntity | IEventEntity[];
}

export interface IEventEntity {
    action: number;
    owner: Parse.User;
    target?: Parse.User;
    /**
     * Parent event related to this.
     */
    parent?: IEventEntity;
}
