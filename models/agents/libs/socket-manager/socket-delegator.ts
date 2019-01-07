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
    private requestPair: { [requestKey: string]: Subject<IAgentResponse> } = {};
    private responsePair: { [requestKey: string]: Subject<IAgentResponse> } = {};
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
                for (let key in this.responsePair)
                    this.responsePair[key].error(err);
                /// clean up and close
                this.requestPair = {};
                this.responsePair = {};
                this.sjClose.next();
            }
        }
        socket.io.on("close", closer("close"));
        socket.io.on("error", closer("error"));
        socket.io.on("message", (data: IAgentStreaming) => {
            /// handle data response
            if (data.type === EAgentRequestType.Response) {
                let key = data.requestKey;
                let sj = this.requestPair[key];
                /// ignore inconnect requestKey for now.
                if (!sj) return;
                switch (data.status) {
                    case EnumAgentResponseStatus.Data:
                        sj.next(data); break;
                    case EnumAgentResponseStatus.Error:
                        sj.error(data); break;
                    case EnumAgentResponseStatus.Complete:
                        sj.complete();
                        this.requestPair[key] = undefined;
                        break;
                }
            } else {
            /// handle data request
                let key = data.requestKey;
                let sj = new Subject<IAgentResponse>();
                this.responsePair[key] = sj;
                sj.subscribe( (data) => {
                    this.socket.send(data);
                }, (err) => {
                    this.socket.send(err);
                }, () => {
                    this.responsePair[key] = undefined;
                })
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