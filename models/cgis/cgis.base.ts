/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

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
