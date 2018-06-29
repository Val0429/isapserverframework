
import { ErrorObject } from './../models/cgis/errors.base';
export * from './../models/cgis/errors.base';
export * from './../models/cgis/cgis.base';
import { Response } from 'express/lib/response';
import { ExpressWsSocket } from './../helpers/middlewares/express-ws-routes';
import { Socket } from './../helpers/sockets/socket-helper';


export class Errors {
    static LoginRequired: ErrorObject = { statusCode: 401, message: "This action requires login." };
    static ParametersRequired: ErrorObject = { statusCode: 401, message: "Parameters required: {0}" };
    static ParametersInvalid: ErrorObject = { statusCode: 404, message: "Parameters invalid: {0}" };
    static RequestFailed: ErrorObject = { statusCode: 404, message: "Request failed." };
    static PermissionDenined: ErrorObject = { statusCode: 404, message: "Permission denined." };
    static SessionNotExists: ErrorObject = { statusCode: 404, message: "Session not exists." };
    static CustomAlreadyExists: ErrorObject = { statusCode: 400, message: "{0}" };
    static CustomNotExists: ErrorObject = { statusCode: 404, message: "{0}" };
    static CustomInvalid: ErrorObject = { statusCode: 404, message: "{0}" };
    static Custom: ErrorObject = { statusCode: 500, message: "{0}" };
    static VisitorAlreadyExists: ErrorObject = { statusCode: 400, message: "An visitor with this key already exists." };
    static VisitorNotExists: ErrorObject = { statusCode: 400, message: "An visitor with this key not exists." };

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
            (async () => {
                var socket: Socket;
                if (socket = await Socket.get(res)) {
                    socket.send(JSON.stringify({
                        statusCode: this.detail.statusCode,
                        message
                    }));
                    socket.closeGracefully();

                } else {
                    res.status(this.detail.statusCode)
                    .send(message);
                }
            })();
        }
        return message;
    }
}
