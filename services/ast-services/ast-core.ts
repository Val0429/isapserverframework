import { Action } from 'helpers/cgi-helpers/core';
import { SourceFile } from 'ts-simple-ast';
import { Errors } from 'core/errors.gen';

export enum EnumRequestType {
    init = 0,
    normal = 1,
    requestType = 2,
}

export type Request = RequestInit | RequestNormal | RequestReportType;
export type Response = ResponseNormal;

export type RequestType<T> =
    T extends EnumRequestType.init ? RequestInit :
    T extends EnumRequestType.normal ? RequestNormal :
    T extends EnumRequestType.requestType ? RequestReportType :
    never;

export type ResponseType<T> =
    T extends EnumRequestType.normal ? ResponseNormal :
    never;

export function getRequestType<T extends EnumRequestType>(type: T, data: Request): RequestType<T> {
    return <any>data;
}

export function getResponseType<T extends EnumRequestType>(type: T, data: Response): ResponseType<T> {
    return <any>data;
}

export interface RequestInit {
    action: EnumRequestType.init;
    actions: Action[];
}

export interface RequestBase {
    sessionId?: string;
}

export interface RequestNormal extends RequestBase {
    action: EnumRequestType.normal;
    type: TypesFromAction;
    data: any;
}

export interface ResponseNormal extends RequestBase {
    action: EnumRequestType.normal;
    data: any;
}

export interface RequestReportType extends RequestBase {
    action: EnumRequestType.requestType;
    type: TypesFromAction;
}

export interface ResponseReportType extends RequestBase {
    action: EnumRequestType.requestType;
    data: string;
}

export interface TypesFromAction {
    path: string | SourceFile;
    type: string;
}


export interface ConverterEntity {
    __type__: string;
    class?: string;
    data: any;
}

/// Type Converter
export interface IvParseFile {
    name: string;
    type: string;
    data: string;
}
export type vParseFile =
    /**
     * pure base64 string.
     */
    string |
    /**
     * name: filename with ext name.
     * type: mime-type.
     * data: pure base64 string.
     */
    IvParseFile;