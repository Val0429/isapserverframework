import { Errors } from "core/errors.gen";
import { ActionParam } from "helpers/cgi-helpers/core";
import { AstServerConverter } from "./ast-service";
import { AstClientConverter } from "./ast-client";

/// Direct Converter
export namespace AstExternalConverter {
    interface IRegularize {
        parameters: any;
        inputType: any;
        keys: string[];
    }

    function deepTrace(regular: IRegularize, required: boolean = true, isArray: boolean = false, callback: any, prevkeys: string[] = []) {
        let { parameters, inputType, keys } = regular;
        let key = keys.shift();
        prevkeys.push(key);
        parameters = parameters[key];
        do {
            if (parameters == undefined) {
                /// required handler
                if (!required) return;
                /// required
                if (keys.length !== 0) throw Errors.throw(Errors.ParametersRequired, [`<${prevkeys.join(".")}>`]);
                break;

            } else {
                if (keys.length === 0) break;
                /// check parameter type, and create inputType accordingly
                if (typeof parameters !== "object") {
                    if (!required) return;
                    throw Errors.throw(Errors.CustomInvalid, [`<${prevkeys.join(".")}> should be an object or array.`]);
                }
                let isArray = Array.isArray(parameters);
                inputType = inputType[key] || (
                    inputType[key] = isArray ? [] : {}
                );
                deepTrace({parameters, inputType, keys}, required, callback, prevkeys);
            }
            return;
        } while(0);
        /// there are one exception, which parameters are an array
        if (isArray)
            inputType[key] = parameters.map( parameters => callback(parameters, key) );
        else
            inputType[key] = callback(parameters, key);
    }

    function regularize<T>(data: ActionParam<T>, keyparam: string): IRegularize {
        let parameters = data.parameters;
        let inputType = data.inputType || (data.inputType = {} as any);
        let keys = keyparam.split(".");
        return { parameters, inputType, keys };
    }

    export function toBoolean<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            return AstServerConverter.toBoolean(parameter, key);
        });
    }

    export function toString<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            return AstServerConverter.toString(parameter, key);
        });
    }

    export function toNumber<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            return AstServerConverter.toNumber(parameter, key);
        });
    }

    export function toBuffer<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            return AstClientConverter.fromBufferEntity(AstServerConverter.toBufferEntity(parameter, key));
        });
    }

    export function toArray<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            if (typeof parameter === "object" && Array.isArray(parameter))
                return [];
            else if (required)
                throw Errors.throw(Errors.CustomInvalid, [`<${keyparam}> should be valid array.`]);
        });
    }

    export function toObject<T>(data: ActionParam<T>, keyparam: string, required: boolean = true, isArray: boolean = false) {
        deepTrace(regularize(data, keyparam), required, isArray, (parameter, key) => {
            if (typeof parameter === "object" && !Array.isArray(parameter))
                return {};
            else if (required)
                throw Errors.throw(Errors.CustomInvalid, [`<${keyparam}> should be valid object.`]);
        });
    }
}
