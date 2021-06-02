export type ParseData<T = {}> = {
    _id?: string;
    _created_at?: Date;
    _updated_at?: Date;
} & T;
