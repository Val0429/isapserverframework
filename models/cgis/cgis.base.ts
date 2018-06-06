export interface IInputPaging {
    page: number;
    pageSize: number;
}
export interface IOutputPaging<T> extends IInputPaging {
    total: number;
    totalPages: number;
    results: T;
}
