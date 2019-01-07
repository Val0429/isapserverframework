import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus } from "../core";
import { Subject, Observable } from "rxjs";
import { Socket, ActionParam } from "helpers/cgi-helpers/core";
import { idGenerate } from "../id-generator";

export interface ISocketDelegatorRequest {
    request: IAgentRequest;
    response: Subject<IAgentResponse>;
}

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
                for (let key in this.requestPair)
                    this.requestPair[key].error(err);
                for (let key in this.responsePair) {
                    this.responsePair[key].error(err);
                }
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
                let sj = this.requestPair[key];
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
                let sj = new Subject<IAgentResponse>();
                this.responsePair[requestKey] = sj;
                let respBase = { type: EAgentRequestType.Response, agentType, funcName, requestKey, objectKey, data: null };
                /// inject timestamp
                let injectTimestamp = (data = undefined) => ({ data: { ...data, timestamp: new Date().toISOString() } });
                sj.subscribe( (data) => {
                    this.socket.send({ ...respBase, ...injectTimestamp(data), status: EnumAgentResponseStatus.Data });
                }, (err) => {
                    this.socket.send({ ...respBase, ...injectTimestamp(data), status: EnumAgentResponseStatus.Error });
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

    public request(data: IAgentRequest): Observable<IAgentResponse> {
        if (!data.objectKey) data.objectKey = idGenerate();
        if (!data.requestKey) data.requestKey = idGenerate();
        let sj = new Subject<IAgentResponse>();
        this.requestPair[data.requestKey] = sj;
        this.socket.send(data);
        return sj.asObservable();
    }
}