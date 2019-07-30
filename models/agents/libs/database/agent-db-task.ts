/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus, ITaskFunctionScheduler, ITaskFunctionFilter } from "../core";
import { ParseObject, registerSubclass } from "helpers/cgi-helpers/core";
import { Mutex, jsMapAssign } from "helpers/utility";

export interface IAgentDBRequest {
    /// unique key of Function request.
    requestKey: string;
    /// e.g. LiveFaces
    funcName: string;
    /// argument of Function.
    data: any;

    scheduler?: ITaskFunctionScheduler;
    filter?: ITaskFunctionFilter;
    dataKeeping?: any;
    outputEvent?: boolean;
}
export interface IAgentDBTask {
    objectKey: string;
    agentType: string;
    initArgument: any;
    tasks: IAgentDBRequest[];
}
@registerSubclass() export class AgentDBTask extends ParseObject<IAgentDBTask> {
}

type ObjectKey = string;
type UserTasks = Map<ObjectKey, AgentDBTask>;
type InstanceCache = AgentDBTasks;

export class AgentDBTasks {
    private mtx: Mutex = new Mutex();
    public tasks: UserTasks;

    private constructor() {}
    private static userTasks: UserTasks;

    private static async initUserTasks() {
        if (this.userTasks) return;
        let tasks = await new Parse.Query(AgentDBTask).find();
        this.userTasks = new Map(
            tasks.map<[string, AgentDBTask]>( (task) => [task.getValue("objectKey") as string, task] )
        );
    }

    private static instanceCache: InstanceCache;
    private static mtxGetInstance: Mutex = new Mutex();
    public static async getInstance(): Promise<AgentDBTasks> {
        await this.mtxGetInstance.acquire();
        /// preload all tasks
        await this.initUserTasks();
 
        let result: AgentDBTasks;
        do {
            /// check cache
            let cache = this.instanceCache;
            if (cache) { result = cache; break; }
            /// create new
            result = new AgentDBTasks();
            this.instanceCache = result;
            result.tasks = this.userTasks;
        } while(0);

        this.mtxGetInstance.release();
        return result;
    }

    async sync(data: IAgentStreaming) {
        await this.mtx.acquire();
        switch (data.type) {
            /// Agent receive Request
            case EAgentRequestType.Request: {
                let input = data as IAgentRequest;
                let { funcName, objectKey, agentType, data: initArgument, requestKey } = input;

                /// 0) don't handle Start / Stop
                if (funcName === 'Start' || funcName === 'Stop') break;

                let obj: AgentDBTask = this.tasks.get(objectKey);
                /// 1) If funcName = Initialize, create / initial AgentDBTask
                if (funcName === "Initialize") {
                    if (!obj) obj = jsMapAssign(this.tasks, objectKey, () => new AgentDBTask({ objectKey, tasks: [] }));
                    obj.setValue("agentType", agentType);
                    obj.setValue("initArgument", initArgument);
                    await obj.save();
                }
                /// 2) If funcName = Dispose, delete AgentDBTask
                else if(funcName === "Dispose") {
                    if (obj) {
                        await obj.destroy();
                        this.tasks.delete(objectKey);
                    }
                }
                /// 3) If funcName = ^~, delete AgentDBTask.tasks
                else if(/^~/.test(funcName)) {
                    funcName = funcName.replace(/^~/, "");
                    let tasks = obj.getValue("tasks");
                    let idx = tasks.findIndex((task) => task.requestKey === requestKey);
                    if (idx >= 0) {
                        obj.setValue("tasks", [...tasks.slice(0, idx), ...tasks.slice(idx+1, tasks.length)]);
                        await obj.save();
                    }
                }
                /// 4) Otherwise, create AgentDBTask.tasks. (only if dataKeeping exists)
                else if (input.dataKeeping) {
                    let tasks = obj.getValue("tasks");
                    let idx = tasks.findIndex((task) => task.requestKey === requestKey);
                    if (idx >= 0) obj.setValue("tasks", [...tasks.slice(0, idx), input, ...tasks.slice(idx+1, tasks.length)]);
                    else obj.setValue("tasks", [...tasks, input]);
                    await obj.save();
                }
            } break;

            /// Agent send Response
            case EAgentRequestType.Response: {
                let input = data as IAgentResponse;
                let { funcName, objectKey, agentType, data: argument, requestKey, status } = input;

                /// 0) don't handle Start / Stop
                if (funcName === 'Start' || funcName === 'Stop') break;

                let obj: AgentDBTask = this.tasks.get(objectKey);
                /// 0) status === Data, break;
                if (status === EnumAgentResponseStatus.Data) break;
                /// 1) If funcName != Initialize | Dispose, and status === Error | Complete, delete AgentDBTask.tasks
                if (
                    (status === EnumAgentResponseStatus.Complete || status === EnumAgentResponseStatus.Error) &&
                    (!(funcName === "Initialize" || funcName === "Dispose"))
                ) {
                    let tasks = obj.getValue("tasks");
                    let idx = tasks.findIndex((task) => task.requestKey === requestKey);
                    if (idx >= 0) {
                        obj.setValue("tasks", [...tasks.slice(0, idx), ...tasks.slice(idx+1, tasks.length)]);
                        await obj.save();
                    }
                }
            } break;
            default: break;
        }
        this.mtx.release();
    }

}