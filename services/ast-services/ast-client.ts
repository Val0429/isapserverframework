const { fork } = require('child_process');
import { RequestInit, RequestNormal, RequestBase, EnumRequestType, TypesFromAction, Response, ConverterEntity, IvParseFile } from './ast-core';
import { Errors } from 'core/errors.gen';
import { actions } from 'helpers/routers/router-loader';
import { serverReady } from 'core/pending-tasks';
import { ParseObject, retrievePrimaryClass } from 'helpers/parse-server/parse-helper';
import { FileHelper } from 'helpers/parse-server/file-helper';
const uuidv1 = require('uuid/v1');
const caller = require('caller');

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
                        (await AstConverter.fromParseObjectEntity(data)) ||
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

        /// don't do init for now
        // (async () => {
        //     await serverReady;
        //     /// send init
        //     var data: RequestInit = {
        //         action: EnumRequestType.init,
        //         actions
        //     };
        //     this.process.send(data);
        // })();
    }

    request(request: RequestBase): Promise<any> {
        var sessionId = request.sessionId = uuidv1();
        this.process.send(request);
        var resolve, reject;
        var promise = new Promise( (res, rej) => {
            resolve = res; reject = rej;
        });
        this.clients[sessionId] = {
            resolve, reject, promise
        }
        return promise;
    }
    requestValidation(nameOfType: string, data: any): Promise<any>;
    requestValidation(type: TypesFromAction, data: any): Promise<any>;
    requestValidation(type: string | TypesFromAction, data: any): Promise<any> {
        /// turn string into TypesFromAction
        if (typeof(type) === 'string') {
            type = { path: caller(), type: type as string };
        }
        /// perform
        var send: RequestNormal = {
            action: EnumRequestType.normal,
            type,
            data
        };
        return this.request(send);
    }

    // requestValidation(nameOfType: string, data: any): Promise<any> {

    // }
    // requestValidation(type: TypesFromAction, data: any): Promise<any> {
    //     var send: RequestNormal = {
    //         action: EnumRequestType.normal,
    //         type,
    //         data
    //     };
    //     return this.request(send);
    // }

}

var ast = new AstClient();
export default ast;

namespace AstJSONConverter {
    export function neutualizeData(data: object): object {
        /**
         * Allow input types:
         * 1) boolean
         * 2) string
         * 3) number
         * 4) Date --- string | number
         * 5) Enum --- string | number
         * 6) ParseObject --- Object
         * 7) Object --- Object
         * 8) Array --- Array
         * 10) Parse.File --- uri
         * 16) Parse.User
         */

        var filterRules = {
            "Parse.User": {
                ACL: null,
                sessionToken: null,
            },
            "Parse.Role": {
                ACL: null,
            }
        }
         
        var NeutualizeType = (data: any, filter: any): any => {
            var refDetect = {};
            var neutualize = (data: any, filter: any): any => {
                var type = typeof data;
                if (type === 'boolean') return data;
                else if (type === 'string') return data;
                else if (type === 'number') return data;
                else if (type === 'undefined') return data;
                else if (data instanceof Date) return data.toISOString();
                else if (data instanceof Parse.File) return data.url();
                else if (data instanceof Parse.Relation) return undefined;
                else if (data instanceof Parse.Object) {
                    if (!data.id || refDetect[data.id]) return undefined;
                    if (data instanceof Parse.User) filter = filter || filterRules["Parse.User"];
                    if (data.className === '_Role') filter = filter || filterRules["Parse.Role"];
                    refDetect[data.id] = true;
                    return ({
                        objectId: data.id,
                        ...neutualize(data.attributes, filter)
                    });
                }
                else if (type === 'object') {
                    // return data;
                    var result = {};

                    for (var key in data) {
                        var cfilter = Array.isArray(data) ? filter : (filter ? filter[key] : undefined);
                        if (cfilter === null) result[key] = undefined;
                        else if (typeof cfilter === 'function') result[key] = cfilter(data[key]);
                        else result[key] = neutualize(data[key], cfilter);
                    } return result;
                } else {
                    throw `Inner Error: ${type} is not accepted output type.`;
                }
            }
            return neutualize(data, filter);
        };

        return NeutualizeType(data, null);
    }
}

namespace AstConverter {

    export function fromDateEntity(input: ConverterEntity): Date {
        if (input.__type__ !== "Date") return;
        return new Date(input.data);
    }

    export async function fromParseObjectEntity(input: ConverterEntity): Promise<ParseObject<any>> {
        if (input.__type__ !== "ParseObject") return;
        var cls: any = retrievePrimaryClass(input.class);
        /// special case of Parse.User
        if (input.class === 'User') cls = Parse.User;
        if (!cls) throw Errors.throw(Errors.CustomInvalid, [`Inner type <${input.class}> is not a registered class.`]);

        /// pure string object
        if (typeof input.data === 'string') {
            if (input.data === "") throw Errors.throw(Errors.CustomInvalid, [`<${input.class}> should not be empty.`]);
            var obj = new cls();
            obj.id = input.data;
            try {
                await obj.fetch();
            } catch(e) {
                if (e.code === 101) throw Errors.throw(Errors.CustomInvalid, [`<${input.data}> not exists in <${input.class}>.`]);
                throw e;
            }
            return obj;
        }

        /// data has to be converted
        var obj = new cls( await ast.finalConverter(input.data) );
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