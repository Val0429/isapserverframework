const { fork } = require('child_process');
import { RequestInit, RequestNormal, EnumRequestType, TypesFromAction, Response, ConverterEntity, IvParseFile } from './ast-core';
import { Errors } from './../../core/errors.gen';
import { actions } from './../../helpers/routers/router-loader';
import { waitServerReady } from './../../core/pending-tasks';
import { ParseObject, retrievePrimaryClass } from './../../helpers/parse-server/parse-helper';
import { FileHelper } from './../../helpers/parse-server/file-helper';
const uuidv1 = require('uuid/v1');

interface Client {
    promise: Promise<any>;
    resolve: any;
    reject: any;
}

export class AstClient {
    process: any;
    private clients: { [index: string]: Client } = {};

    async finalConverter(data: any): Promise<any> {
        if (typeof data !== 'object') {
            return data;
        }

        /// try convert back
        try {
            var result = AstConverter.fromDateEntity(data) ||
                        AstConverter.fromParseObjectEntity(data) ||
                        (await AstConverter.fromParseFileEntity(data))
                        ;
            if (result) return result;

            for (var key in data) {
                var value = data[key];
                data[key] = await this.finalConverter(value);
            }

        } catch(reason) {
            if (reason instanceof Errors) throw reason;
            throw Errors.throw(Errors.Custom, [reason]);
        }

        return data;
    }

    constructor() {
        this.process = fork(`${__dirname}/ast-service.ts`);

        this.process.on('message', async (msg: Response) => {
            var client = this.clients[msg.sessionId];
            if (client) {
                this.clients[msg.sessionId] = undefined;
                if (msg.data && msg.data["detail"] && msg.data["args"]!==undefined)
                    return client.reject( new Errors(msg.data) );
                
                try {
                    client.resolve( await this.finalConverter( msg.data ) );
                } catch(reason) {
                    client.reject(reason);
                }
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

    export async function fromParseFileEntity(input: ConverterEntity): Promise<Parse.File> {
        if (input.__type__ !== "Parse.File") return;
        var data, name, mime;
        if (typeof input.data === 'string') {
            data = input.data;
        } else {
            var entity: IvParseFile = input.data;
            data = entity.data;
            name = entity.name;
            mime = entity.type;
        }
        return await FileHelper.toParseFile(data, name, mime) as Parse.File;
    }
}