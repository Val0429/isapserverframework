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


export namespace AstConverter {
    export function toBoolean(input: string | number | boolean | any, name: string): boolean {
        return typeof input === 'string' ? (input === 'true' ? true : false) :
            typeof input === 'number' ? (input === 1 ? true : false) :
            (input ? true : false);
    }

    export function toString(input: string, name: string): string {
        if (typeof input !== 'string') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be string.`]);
        return input;
    }

    export function toNumber(input: string | number, name: string): number {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be number.`]);
        if (typeof input === 'string') return parseInt(input, 10);
        return input;
    }

    export function toDateEntity(input: string | number, name: string): string {
        if (typeof input !== 'string' && typeof input !== 'number') throw Errors.throw(Errors.CustomInvalid, [`<${name}> should be valid string or number of Date.`]);
        return `<!@#${new Date(input).toISOString()}#@!>`;
    }

    export function tryParseDateEntity(input: string): Date {
        if (typeof input !== 'string') return;
        if (input.substr(0, 4) === '<!@#' && input.substr(input.length-4, 4) === '#@!>') {
            return new Date(input.substr(4, input.length-8));
        }
    }
    
}
