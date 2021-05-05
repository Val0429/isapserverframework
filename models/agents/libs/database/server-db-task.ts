/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus } from "../core";
import { ParseObject, registerSubclass } from "helpers/cgi-helpers/core";
import { Mutex, jsMapAssign } from "helpers/utility";

export interface IServerDBTask {
    user: Parse.User;
    objectKey: string;
    agentType: string;
    initArgument: any;
    tasks: IAgentRequest[];
}
@registerSubclass() export class ServerDBTask extends ParseObject<IServerDBTask> {
}

type UserObjectID = string;
type ObjectKey = string;
type UserTasks = Map<ObjectKey, ServerDBTask>;
type AllUserTasks = Map<UserObjectID, UserTasks>;
type InstanceCache = Map<UserObjectID, ServerDBTasks>;

/// by User
export class ServerDBTasks {
    private mtx: Mutex = new Mutex();
    private user: Parse.User;
    private tasks: UserTasks;

    private static userTasks: AllUserTasks;
    private constructor() {}

    private static async initAllUserTasks() {
        if (this.userTasks) return;
        let userTasks = this.userTasks = new Map();
        let tasks = await new Parse.Query(ServerDBTask).findAll();
        tasks.forEach( (task) => {
            let userId = task.getValue("user").id;
            let objectKey = task.getValue("objectKey");
            let obj: UserTasks = jsMapAssign(userTasks, userId);
            obj.set(objectKey, task);
        });
    }

    private static instanceCache: InstanceCache = new Map();
    private static mtxGetInstance: Mutex = new Mutex();
    public static async getInstance(user: Parse.User): Promise<ServerDBTasks> {
        await this.mtxGetInstance.acquire();
        /// preload all tasks
        await this.initAllUserTasks();
        
        let result: ServerDBTasks;
        do {
            /// check cache
            let cache = this.instanceCache.get(user.id);
            if (cache) { result = cache; break; }
            /// create new
            result = new ServerDBTasks();
            this.instanceCache.set(user.id, result);
            result.user = user;
            result.tasks = jsMapAssign(this.userTasks, user.id);
        } while(0);

        this.mtxGetInstance.release();
        return result;
    }

    getTasks(): UserTasks {
        return this.tasks;
    }

    async sync(data: IAgentStreaming) {
        await this.mtx.acquire();
        switch (data.type) {
            case EAgentRequestType.Request: {
                let input = data as IAgentRequest;
                let { funcName, objectKey, agentType, data: initArgument, requestKey } = input;

                /// 0) don't handle Start / Stop
                if (funcName === 'Start' || funcName === 'Stop') break;

                let obj: ServerDBTask = this.tasks.get(objectKey);
                /// 1) If funcName = Initialize, create / initial ServerDBTask
                if (funcName === "Initialize") {
                    if (!obj) obj = jsMapAssign(this.tasks, objectKey, () => new ServerDBTask({ user: this.user, objectKey, tasks: [] }));
                    obj.setValue("agentType", agentType);
                    obj.setValue("initArgument", initArgument);
                    await obj.save();
                }
                /// 2) If funcName = Dispose, delete ServerDBTask
                else if(funcName === "Dispose") {
                    if (obj) {
                        await obj.destroy();
                        this.tasks.delete(objectKey);
                    }
                }
                /// 3) If funcName = ^~, delete ServerDBTask.tasks
                else if(/^~/.test(funcName)) {
                    funcName = funcName.replace(/^~/, "");
                    let tasks = obj.getValue("tasks");
                    let idx = tasks.findIndex((task) => task.requestKey === requestKey);
                    if (idx >= 0) {
                        obj.setValue("tasks", [...tasks.slice(0, idx), ...tasks.slice(idx+1, tasks.length)]);
                        await obj.save();
                    }
                }
                /// 4) Otherwise, create ServerDBTask.tasks
                else {
                    let tasks = obj.getValue("tasks");
                    let idx = tasks.findIndex((task) => task.requestKey === requestKey);
                    if (idx >= 0) obj.setValue("tasks", [...tasks.slice(0, idx), input, ...tasks.slice(idx+1, tasks.length)]);
                    else obj.setValue("tasks", [...tasks, input]);
                    await obj.save();
                }
            } break;
            case EAgentRequestType.Response: {
                let input = data as IAgentResponse;
                let { funcName, objectKey, agentType, data: argument, requestKey, status } = input;

                /// 0) don't handle Start / Stop
                if (funcName === 'Start' || funcName === 'Stop') break;

                let obj: ServerDBTask = this.tasks.get(objectKey);
                /// 0.1) manually call dispose case
                if (!obj) return;
                /// 1) status === Data, break;
                if (status === EnumAgentResponseStatus.Data) break;
                /// 2) If funcName != Initialize | Dispose, and status === Error | Complete, delete ServerDBTask.tasks
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