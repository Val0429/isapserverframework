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

/// For Sort
export enum ESort {
    Ascending,
    Descending
}

export interface IInputSortingBaseUnit {
    field: string;
    order: ESort;
}

export type IInputSortingBase = IInputSortingBaseUnit ;//| IInputSortingBaseUnit<T>[];
/// For Sort End

/// For Filter
export enum EFilteringType {
    String,
    Number
}

export enum EFilteringNumberCriteria {
    EqualTo,
    MoreThan,
    MoreThanOrEqualTo,
    LessThan,
    LessThanOrEqualTo,
    Not
}
export interface IInputFilteringNumberBaseUnit<T> {
    field: keyof T;
    type: EFilteringType.Number;
    criteria: EFilteringNumberCriteria;
    value: Number;
}

export enum EFilteringStringCriteria {
    EqualTo,
    Like,
    Regex,
    NotContainIn,
    Contains
}

export interface IInputFilteringStringBaseUnit {
    type?: EFilteringType.String;
    field?: string;
    criteria?: EFilteringStringCriteria;
    value?: string;
}

export type IInputFilteringBaseUnit = IInputFilteringStringBaseUnit ;//| IInputFilteringNumberBaseUnit<T>;
export type IInputFilteringBase = IInputFilteringBaseUnit;// | IInputFilteringBaseUnit<T>[];


/// For Filter End


export type IInputPaging<T> = {
    paging?: IInputPagingBase;
    sorting?: IInputSortingBase;
    filtering?: IInputFilteringBase;
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
