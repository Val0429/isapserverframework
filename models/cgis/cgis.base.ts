// export interface IInputPaging {
//     page?: number;
//     pageSize?: number;
//     all?: "true" | "false";
// }
export interface IInputPagingBase {
    page?: number;
    pageSize?: number;
}

export type IInputPaging<T> = (IInputPagingBase | {
    all: true | false;
}) & T;

export interface IOutputPaging<T> extends IInputPagingBase {
    total: number;
    totalPages?: number;
    results: T[];
}

