export enum ESort {
    Ascending,
    Descending,
}

export interface ISorting {
    field: string;
    order: ESort;
}

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
    sorting?: ISorting;
    objectId?: string;
    keyword?: string;
}

export interface IMultiData {
    datas: any[];
}

export interface IDelete {
    objectId: string | string[];
}
