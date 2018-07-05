const { fork } = require('child_process');
import { RequestInit, RequestNormal, EnumRequestType, TypesFromAction, Response, ConverterEntity } from './ast-core';
import { Errors } from './../../core/errors.gen';
import { actions } from './../../helpers/routers/router-loader';
import { waitServerReady } from './../../core/pending-tasks';
import { ParseObject, retrievePrimaryClass } from './../../helpers/parse-server/parse-helper';
const uuidv1 = require('uuid/v1');

interface Client {
    promise: Promise<any>;
    resolve: any;
    reject: any;
}

export class AstClient {
    process: any;
    private clients: { [index: string]: Client } = {};

    finalConverter(data: any): any {
        if (typeof data !== 'object') {
            return data;
        }

        /// try convert back
        var result = AstConverter.fromDateEntity(data) ||
                     AstConverter.fromParseObjectEntity(data);
        if (result) return result;

        for (var key in data) {
            var value = data[key];
            data[key] = this.finalConverter(value);
        }
        return data;
    }

    constructor() {
        this.process = fork(`${__dirname}/ast-service.ts`);

        this.process.on('message', (msg: Response) => {
            var client = this.clients[msg.sessionId];
            if (client) {
                this.clients[msg.sessionId] = undefined;
                if (msg.data && msg.data["detail"] && msg.data["args"]!==undefined)
                    return client.reject(Errors.throw(msg.data["detail"], msg.data["args"]));
                
                client.resolve( this.finalConverter( msg.data ) );
                //client.resolve( msg.data );
            }
        });

        waitServerReady( () => {
            /// send init
            var data: RequestInit = {
                action: EnumRequestType.init,
                actions
            };
            this.process.send(data);
        });
    }

    requestValidation(type: TypesFromAction, data: any): Promise<any> {
        let sessionId = uuidv1();
        var send: RequestNormal = {
            action: EnumRequestType.normal,
            sessionId,
            type,
            data
        };
        this.process.send(send);
        var resolve, reject;
        var promise = new Promise( (res, rej) => {
            resolve = res; reject = rej;
        });
        this.clients[sessionId] = {
            resolve, reject, promise
        }
        return promise;
    }
}

export default new AstClient();


namespace AstConverter {

    export function fromDateEntity(input: ConverterEntity): Date {
        if (input.__type__ !== "Date") return;
        return new Date(input.data);
    }

    export function fromParseObjectEntity(input: ConverterEntity): ParseObject<any> {
        if (input.__type__ !== "ParseObject") return;
        var cls: any = retrievePrimaryClass(input.class);
        if (!cls) throw Errors.throw(Errors.CustomInvalid, [`Inner type <${input.class}> is not a registered class.`]);
        
        /// create ParseObject
        var obj = new cls( typeof input.data === 'string' ? undefined : input.data );
        /// set id
        if (typeof input.data === 'string') obj.id = input.data;

        return obj;
    }
}