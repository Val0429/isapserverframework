export interface IInputPaging {
    page?: number;
    pageSize?: number;
    all?: "true" | "false";
}
export interface IOutputPaging<T> extends IInputPaging {
    total: number;
    totalPages?: number;
    all?: never;
    results: T;
}

