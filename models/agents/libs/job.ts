import { Subject, Observable, Observer } from "rxjs";

import { ActionParam } from 'helpers/cgi-helpers/core';
import { IAgentSocketDescriptor, IAgentRequest, IAgentResponse, IRemoteAgent, EnumAgentResponseStatus } from './core';
import * as shortid from './shortid';
import { Errors } from "core/errors.gen";



export let agentSocketDescriptors: {
    [objectId: string]: IAgentSocketDescriptor;
} = {};

let messages: {
    [requestKey: string]: Subject<IAgentResponse>;
} = {};

export class Job {
    public sjCheckIn: Subject<IAgentSocketDescriptor> = new Subject<IAgentSocketDescriptor>();

    private constructor() {}
    private static sharedIns: Job;
    static sharedInstance(): Job {
        return Job.sharedIns || (Job.sharedIns = new Job());
    }

    checkIn(data: ActionParam<any>) {
        /// todo: socket replacement
        let detail = {
            user: data.user,
            socket: data.socket
        };
        detail.socket.io.on("message", (data: IAgentResponse) => {
            data = JSON.parse(data as any);
            messages[data.requestKey] && messages[data.requestKey].next(data);
        });
        agentSocketDescriptors[data.user.id] = detail;
        this.sjCheckIn.next(detail);
    }

    /**
     * 
     * @param name Function name.
     * @param arg Function arg.
     * @param remote Remote info.
     */
    relay<T>(agentType: string, funcName: string, data: any, remote: IRemoteAgent): Observable<T> {
        return Observable.create( (observer: Observer<any>) => {
            let objectKey = remote.name;
            let requestKey = shortid.generate();
            let sjMe = messages[requestKey] = new Subject<IAgentResponse>();

            let trySend = (agent: IAgentSocketDescriptor, data) => {
                agent.socket.send(JSON.stringify({
                    agentType,
                    objectKey,
                    requestKey,
                    funcName,
                    data
                }));
            }

            let id = remote.agent.id;
            let agentdetail = agentSocketDescriptors[id];
            if (agentdetail) {
                trySend(agentdetail, data);
            } else {
                return observer.error(Errors.throw(Errors.CustomBadRequest, [`Agent User <${remote.agent.get("username")}> is not present.`]));
                // /// todo: should throw error when user is not present.
                // this.sjCheckIn
                //     .filter( (v) => v.user.id === id )
                //     .first()
                //     .subscribe( (v) => trySend(v, data) )
            }

            /// hook on request / response
            sjMe.subscribe( (data) => {
                switch (data.status) {
                    case EnumAgentResponseStatus.Data:
                        observer.next(data.data); break;
                    case EnumAgentResponseStatus.Error:
                        observer.error(data.data); break;
                    case EnumAgentResponseStatus.Complete:
                        observer.complete();
                }
            }, (err) => {}, () => {

            });

        });
    }
}