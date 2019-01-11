import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus } from "../core";
import { ParseObject, registerSubclass } from "helpers/cgi-helpers/core";
import { Mutex, jsMapAssign } from "helpers/utility";

export interface IAgentDBTask {
    objectKey: string;
    agentType: string;
    initArgument: any;
    tasks: IAgentRequest[];
}
@registerSubclass() class AgentDBTask extends ParseObject<IAgentDBTask> {
}

type ObjectKey = string;
type UserTasks = Map<ObjectKey, AgentDBTask>;
type InstanceCache = AgentDBTasks;

export class AgentDBTasks {
    private mtx: Mutex = new Mutex();
    private tasks: UserTasks;

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
    public static async getInstance(user: Parse.User): Promise<AgentDBTasks> {
        /// preload all tasks
        await this.initUserTasks();
        /// check cache
        let cache = this.instanceCache;
        if (cache) return cache;
        /// create new
        let result = new AgentDBTasks();
        this.instanceCache = result;
        result.tasks = this.userTasks;
        return result;
    }

    async sync(data: IAgentStreaming) {
        await this.mtx.acquire();
        switch (data.type) {
            case EAgentRequestType.Request: {
                let input = data as IAgentRequest;
                let { funcName, objectKey, agentType, data: initArgument, requestKey } = input;
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
                /// 4) Otherwise, create AgentDBTask.tasks
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