export interface IPaging {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface IDataList<T> {
    paging: IPaging;
    results: T[];
}

export interface IResponseMessage {
    statusCode: number;
    objectId: string;
    message: string;
}

export interface IMultiData {
    datas: IResponseMessage[];
}

export interface IObject {
    objectId: string;
    name: string;
}

export interface IMessage<T = string> {
    result: boolean;
    message: string;
    content: T;
}
