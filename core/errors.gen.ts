
import { ErrorObject } from './../models/cgis/errors.base';
export * from './../models/cgis/errors.base';
import { Response } from 'express/lib/response';
import { ExpressWsSocket } from './../helpers/middlewares/express-ws-routes';


export class Errors {
    static LoginRequired: ErrorObject = { statusCode: 401, message: "This action requires login." };
    static ParametersRequired: ErrorObject = { statusCode: 401, message: "Parameters required: {0}" };
    static RequestFailed: ErrorObject = { statusCode: 404, message: "Request failed." };
    static PermissionDenined: ErrorObject = { statusCode: 404, message: "Permission denined." };
    static SessionNotExists: ErrorObject = { statusCode: 404, message: "Session not exists." };

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

    resolve(res: Response = null): string {
        var message = this.detail.message;
        do {
            if (!this.args) break;
            for (var i=0; i<this.args.length; ++i) {
                var arg = this.args[i];
                message = message.replace(new RegExp(`\\{${i}\\}`, "g"), arg);
            }
        } while(0);
        
        if (res) {
            if ((<any>res)._websocket) {
                var ws: ExpressWsSocket = (<any>res)._websocket;
                ws.cb(false, this.detail.statusCode, message);

            } else {
                res.status(this.detail.statusCode)
                   .end(message);
            }
        }
        return message;
    }
}
