
import { ErrorObject } from './../models/cgis/errors.base';
export * from './../models/cgis/errors.base';


export class Errors {
    static LoginRequired: ErrorObject = { statusCode: 401, message: "This action requires login." };
    static ParametersRequired: ErrorObject = { statusCode: 401, message: "Parameters required: {0}" };
    static RequestFailed: ErrorObject = { statusCode: 404, message: "Request failed." };
    static PermissionDenined: ErrorObject = { statusCode: 404, message: "Permission denined." };

    detail: ErrorObject;
    args: string[];

    constructor(error: ErrorObject) {
        this.detail = error;
    }

    static throw(error: ErrorObject, args: string[] = null): Errors {
        var rtn = new Errors(error);
        rtn.args = args;
        return rtn;
    }

    resolve(): string {
        var message = this.detail.message;
        if (!this.args) return message;
        for (var i=0; i<this.args.length; ++i) {
            var arg = this.args[i];
            message = message.replace(new RegExp(`\{${i}\}`, "g"), arg);
        }
        return message;
    }
}
