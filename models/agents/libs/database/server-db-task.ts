import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus } from "../core";
import { ParseObject, registerSubclass } from "helpers/cgi-helpers/core";
import { Mutex } from "helpers/utility";

export interface IServerDBTask {
    user: Parse.User;
    objectKey: string;
    agentType: string;
    initArgument: any;
    tasks: IAgentRequest[];
}
@registerSubclass() class ServerDBTask extends ParseObject<IServerDBTask> {
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
    private tasks: Map<string, ServerDBTask>;

    private static userTasks: AllUserTasks;
    private constructor() {}

    private static async initAllUserTasks() {
        if (this.userTasks) return;
        let userTasks = this.userTasks = new Map();
        let tasks = await new Parse.Query(ServerDBTask).find();
        tasks.forEach( (task) => {
            let userId = task.getValue("user").id;
            let objectKey = task.getValue("objectKey");
            let obj: UserTasks = userTasks[userId] = (userTasks[userId] || new Map());
            obj[objectKey] = task;
        });
    }

    private static instanceCache: InstanceCache = new Map();
    public static async getInstance(user: Parse.User): Promise<ServerDBTasks> {
        /// preload all tasks
        await this.initAllUserTasks();
        /// check cache
        let cache = this.instanceCache[user.id];
        if (cache) return cache;
        /// create new
        let result = new ServerDBTasks();
        this.instanceCache[user.id] = result;
        result.user = user;
        result.tasks = this.userTasks[user.id] = (this.userTasks[user.id] || new Map());
        return result;
    }

    async sync(data: IAgentStreaming) {
        await this.mtx.acquire();
        switch (data.type) {
            case EAgentRequestType.Request: {
                let input = data as IAgentRequest;
                let { funcName, objectKey, agentType, data: initArgument, requestKey } = input;
                let obj: ServerDBTask = this.tasks[objectKey];
                /// 1) If funcName = Initialize, create / initial ServerDBTask
                if (funcName === "Initialize") {
                    if (!obj) obj = this.tasks[objectKey] = new ServerDBTask({ user: this.user, objectKey, tasks: [] });
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
                let obj: ServerDBTask = this.tasks[objectKey];
                /// 0) status === Data, break;
                if (status === EnumAgentResponseStatus.Data) break;
                /// 1) If funcName != Initialize | Dispose, and status === Error | Complete, delete ServerDBTask.tasks
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