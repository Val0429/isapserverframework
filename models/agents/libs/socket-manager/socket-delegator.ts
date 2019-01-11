import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus, IRemoteAgentTask } from "../core";
import { Subject, Observable } from "rxjs";
import { Socket, ActionParam, ParseObject } from "helpers/cgi-helpers/core";
import { idGenerate } from "../id-generator";

export interface ISocketDelegatorRequest {
    request: IAgentRequest;
    response: Subject<IAgentResponse>;
}

/**
 * General class that encapsulate Socket, into request / response model.
 * Socket will only been sent from this class.
 */
export class SocketDelegator {
    private socket: Socket;
    private requestPair: Map<string, Subject<IAgentResponse>> = new Map();
    private responsePair: Map<string, Subject<IAgentResponse>> = new Map();
    public sjRequest: Subject<ISocketDelegatorRequest> = new Subject<ISocketDelegatorRequest>();
    public sjClose: Subject<void> = new Subject<void>();

    constructor(socket: Socket) {
        this.socket = socket;
        let closer = (message) => {
            return () => {
                /// throw errors on all Subjects
                let err = `Socket ${message}.`;
                [...this.requestPair.values()].forEach( (value) => value.error(err) );
                [...this.responsePair.values()].forEach( (value) => value.error(err) );
                /// clean up and close
                this.requestPair.clear();
                this.responsePair.clear();
                this.sjClose.next();
            }
        }
        socket.io.on("close", closer("close"));
        socket.io.on("error", closer("error"));
        socket.io.on("message", (data: IAgentStreaming) => {
            /// do deserialize
            data = JSON.parse(data as any);
            /// handle data response
            if (data.type === EAgentRequestType.Response) {
                let key = data.requestKey;
                let sj = this.requestPair.get(key);
                /// ignore inconnect requestKey for now.
                let raw = data.data;
                /// convert back timestamp
                raw.timestamp && (raw.timestamp = new Date(raw.timestamp));
                if (!sj) return;
                switch (data.status) {
                    case EnumAgentResponseStatus.Data:
                        sj.next(raw); break;
                    case EnumAgentResponseStatus.Error:
                        sj.error(raw); break;
                    case EnumAgentResponseStatus.Complete:
                        sj.complete();
                        this.requestPair.delete(key);
                        break;
                }
            } else {
            /// handle data request
                let { requestKey, agentType, funcName, objectKey } = data;
                /// if stop with destructor, try complete
                if (/^~/.test(funcName)) {
                    let res = this.responsePair.get(requestKey);
                    if (!res) return;
                    res.complete();
                    this.responsePair.delete(requestKey);
                    return;
                }
                /// otherwise start
                let sj = new Subject<IAgentResponse>();
                this.responsePair.set(requestKey, sj);
                let respBase = { type: EAgentRequestType.Response, agentType, funcName, requestKey, objectKey, data: null };
                /// inject timestamp
                let injectTimestamp = (data = undefined) => ({ data: { ...data, timestamp: new Date().toISOString() } });
                sj.subscribe( (data) => {
                    /// regularize data
                    data = ParseObject.toOutputJSON(data);
                    this.socket.send({ ...respBase, ...injectTimestamp(data), status: EnumAgentResponseStatus.Data });
                }, (err) => {
                    this.socket.send({ ...respBase, ...injectTimestamp({error: err.toString()}), status: EnumAgentResponseStatus.Error });
                }, () => {
                    this.socket.send({ ...respBase, ...injectTimestamp(), status: EnumAgentResponseStatus.Complete });
                    this.responsePair.delete(requestKey);
                });
                /// do unserialize
                this.sjRequest.next({
                    request: data,
                    response: sj
                });
            }
        });
    }

    /// send request to socket
    public request<T = any>(data: IAgentRequest): Observable<T> {
        let observable = new Observable<T>( (observer) => {
            if (!data.objectKey) data.objectKey = idGenerate();
            if (!data.requestKey) data.requestKey = idGenerate();
            let sj = new Subject<T>();
            this.requestPair.set(data.requestKey, sj as any);
            this.socket.send(data);
            sj.subscribe(observer);
        })
        .finally( () => {
            this.socket.send({...data, funcName: `~${data.funcName}`});
        });
        return observable;
    }
}

