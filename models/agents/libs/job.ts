import { Subject, Observable, Observer } from "rxjs";

import { ActionParam } from 'helpers/cgi-helpers/core';
import { IAgentSocketDescriptor, IAgentRequest, IAgentResponse, IRemoteAgent, EnumAgentResponseStatus, IFunctionRemoteInfo } from './core';
import * as shortid from './shortid';
import { Errors } from "core/errors.gen";
import { ServerTask } from "./server-task";
import { Base, getAgentDescriptorByName } from "./declarations";
import { Log } from "helpers/utility";

/// ImServer
const LogTitle: string = "ImServer";

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

    private managedAgentTasks: { [objectId: string]: Base<any> } = {};
    private universeServerTask(descriptor: IAgentSocketDescriptor, task: ServerTask);
    private universeServerTask(descriptor: IAgentSocketDescriptor, task: ServerTask[]);
    private universeServerTask(descriptor: IAgentSocketDescriptor, serverTasks: ServerTask | ServerTask[]) {
        if (serverTasks instanceof ServerTask) serverTasks = [serverTasks];
        let { user, socket } = descriptor;
        for (let serverTask of serverTasks) {
            let { agent, agentClass, initArgument, objectKey, tasks } = serverTask.attributes;
            /// 1) constructor
            let taskInstance: Base<any> = new (getAgentDescriptorByName(agentClass).classObject)(initArgument, { agent, name: objectKey, syncDB: true });
            taskInstance.Start().toPromise();
            Log.Info(LogTitle, `Created <${agentClass}> for <${agent.id}>.`);
            /// 2) call tasks
            /// todo: handle outputEvent, 
            for (let task of tasks) {
                // taskInstance[task.funcName](task.argument, task).toPromise();
                taskInstance[task.funcName](task.argument, task)
                    .subscribe( (data) => {
                        console.log('111', data);
                    })
            }
        }
    }

    checkIn(data: ActionParam<any>) {
        /// todo: socket replacement
        let detail: IAgentSocketDescriptor = {
            user: data.user,
            socket: data.socket
        };
        detail.socket.io.on("message", (data: IAgentResponse) => {
            data = JSON.parse(data as any);

            messages[data.requestKey] && messages[data.requestKey].next(data);
        });

        (async () => {
            let tasks = await ServerTask.getAll(detail.user);
            this.universeServerTask(detail, tasks);
        })();

        agentSocketDescriptors[data.user.id] = detail;
        this.sjCheckIn.next(detail);
    }

    /**
     * 
     * @param name Function name.
     * @param arg Function arg.
     * @param remote Remote info.
     */
    relay<T>(agentType: string, funcName: string, data: any, remote: IRemoteAgent, info?: IFunctionRemoteInfo): Observable<T> {
        return Observable.create( (observer: Observer<any>) => {
            let { requestKey, filter, scheduler } = info || {} as any;
            if (!requestKey) requestKey = shortid.generate();
            let objectKey = remote.name;
            let sjMe = messages[requestKey] = new Subject<IAgentResponse>();

            let trySend = (agent: IAgentSocketDescriptor, data) => {
                agent.socket.send(JSON.stringify({
                    agentType,
                    objectKey,
                    requestKey,
                    funcName,
                    data,
                    filter,
                    scheduler,
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