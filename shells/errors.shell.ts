import { shellWriter2, autoPad } from 'helpers/shells/shell-writer';

var tHeader = `
import { ErrorObject } from 'models/cgis/errors.base';
export * from 'models/cgis/errors.base';
export * from 'models/cgis/cgis.base';
import { Response } from 'express/lib/response';
import { ExpressWsSocket } from 'helpers/middlewares/express-ws-routes';
import { Socket } from 'helpers/sockets/socket-helper';
`;

var tInterface = `
export class Errors {
{0}

    detail: ErrorObject;
    args: string[];
    tag: any;
    next: Errors;

    constructor(error: ErrorObject | Errors) {
        var err: any = error;
        if (err.statusCode !== undefined && err.message !== undefined) {
            /// ErrorObject
            this.detail = err;
        } else {
            /// from Errors JSON
            this.detail = err.detail;
            this.args = err.args;
            if (err.next) this.append( new Errors(err.next) );
        }
    }

    append(error: Errors) {
        var me: Errors = this;
        while (me.next) me = me.next;
        me.next = error;
    }

    static throw(error: ErrorObject, args: string[] = null): Errors {
        var rtn = new Errors(error);
        rtn.args = args;
        return rtn;
    }

    resolve(res: Response = null, recursive: boolean = true): string {
        var message = this.detail.message;
        do {
            if (!this.args) break;
            for (var i=0; i<this.args.length; ++i) {
                var arg = this.args[i];
                message = message.replace(new RegExp(\`\\\\{\${i}\\\\}\`, "g"), arg);
            }
        } while(0);

        if (recursive) {
            var me: Errors = this;
            while (me.next) {
                me = me.next;
                message += "\\r\\n" + me.resolve(null, false);
            }
        }
        
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
`;

var tInterfaceUnit = `
    static {0}: ErrorObject = { statusCode: {1}, message: "{2}" };
`;

import { Config } from 'models/cgis/errors.define';
function main(events: Config[]): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+$/, '')
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(
            tInterfaceUnit
                      .replace(/^[\r\n]+|[\r\n]+$/g, '')
                      .replace(/\{0\}/g, event[0])
                      .replace(/\{1\}/g, event[1].toString())
                      .replace(/\{2\}/g, event[2])
        );
    }
    tmpstr.push(
        tInterface.replace( /\{0\}/g, tmp.join("\r\n") )
    );
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/errors.gen.ts`;
const tmplPath = `${__dirname}/errors.shell.ts`;
const defPath = `${__dirname}/../models/cgis/errors.define.ts`;
const customDefPath = `${__dirname}/../workspace/define/cgis/errors.define.ts`;

var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';

// shellWriter(
//     [defPath, tmplPath, customDefPath],
//     genFilePath,
//     () => {
//         var merged = [...events, ...cevents];
//         fs.writeFileSync(genFilePath, main(merged), "UTF-8");
//         console.log("<Generated> Error file updated!");        
//     }
// );

shellWriter2(
    genFilePath,
    main([...events, ...cevents]),
    () => {
        console.log("<Generated> Error file updated!");
    }
);