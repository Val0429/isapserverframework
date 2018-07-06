import { Action } from './../../helpers/cgi-helpers/core';
import { SourceFile } from 'ts-simple-ast';
import { Errors } from './../../core/errors.gen';

export enum EnumRequestType {
    init = 0,
    normal = 1
}

export type Request = RequestInit | RequestNormal;
export type Response = ResponseNormal;

export type RequestType<T> =
    T extends EnumRequestType.init ? RequestInit :
    T extends EnumRequestType.normal ? RequestNormal :
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

export interface RequestNormal {
    action: EnumRequestType.normal;
    sessionId: string;
    type: TypesFromAction;
    data: any;
}

export interface ResponseNormal {
    action: EnumRequestType.normal;
    sessionId: string;
    data: any;
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