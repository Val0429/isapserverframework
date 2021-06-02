import { ObjectId } from 'mongodb';

export type MongoData<T = {}> = {
    _id?: ObjectId;
    _created_at?: Date;
    _updated_at?: Date;
} & T;
