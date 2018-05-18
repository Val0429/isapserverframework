
import { ErrorObject } from './../models/cgis/errors.base';
export * from './../models/cgis/errors.base';


export class Error {
    static LoginRequired: ErrorObject = { statusCode: 401, message: "This action requires login." };
    static ParametersRequired: ErrorObject = { statusCode: 401, message: "Parameters required: {0}" };
    static RequestFailed: ErrorObject = { statusCode: 404, message: "Request failed." };
    static PermissionDenined: ErrorObject = { statusCode: 404, message: "Permission denined." };

    detail: ErrorObject;
    constructor(error: ErrorObject) {
        this.detail = error;
    }

    static throw(error: ErrorObject): Error {
        return new Error(error);
    }
}
