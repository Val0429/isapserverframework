export * from './file';
export * from './mongo-data';
export * from './parse-data';
export * from './parse-object';

export interface IObject {
    objectId: string;
    name: string;
}

export interface IKeyValueObject<T> {
    datas: T[];
    dataIdDirectory: {
        [key: string]: IObject;
    };
}

export interface IKeyValueParseObject<T> {
    datas: T[];
    dataIdDirectory: {
        [key: string]: T;
    };
}
