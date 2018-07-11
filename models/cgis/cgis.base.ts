// export interface IInputPaging {
//     page?: number;
//     pageSize?: number;
//     all?: "true" | "false";
// }
export interface IInputPagingBase {
    page?: number;
    pageSize?: number;
    all?: "true" | "false";
}

export type IInputPaging<T> = {
    paging?: IInputPagingBase;
} & T;

export interface IOutputPagingBase {
    total: number;
    totalPages?: number;
}

export type IOutputPaging<T> = {
    paging?: IInputPagingBase & IOutputPagingBase
} & {
    results: T[];
}
