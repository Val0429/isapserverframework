import { ISocketDelegatorRequest } from "../socket-manager";
import { RegistrationDelegator } from "../declarations";
import { IAgentRequest, EAgentRequestType, IAgentResponse } from "../core";
import { jsMapAssign } from "helpers/utility/jsmap-assign";
import { ServerDBTask } from "../database/server-db-task";
import { Log } from "helpers/utility";
import { DataKeeper } from "../data-keeper";
import { ObjectHolder } from "./object-holder";
import { AgentDBTask } from "../database/agent-db-task";
import { idGenerate } from "../id-generator";
import { Subject } from "rxjs";
import { SocketResolver } from "../socket-manager/socket-resolver";

const LogTitle = "Agent.ObjectGenerator";

/**
 * Auto generate objects.
 */

export class ObjectGenerator {
    /// Map<ObjectKey, object> pair
    private objects: Map<string, ObjectHolder> = new Map();
    public next(req: ISocketDelegatorRequest) {
        let { objectKey } = req.request;
        let obj = jsMapAssign(this.objects, objectKey, () => new ObjectHolder(objectKey));
        obj.next(req);
    }

    /// initial local call
    public applyAgentDBTasks(tasks: AgentDBTask[]) {
        tasks.forEach( (task) => {
            let { agentType, initArgument, tasks, objectKey } = task.attributes;
            /// verify task valid
            let valid = false;
            for (let task of tasks) if (task.dataKeeping) { valid = true; break; }
            // if valid, create
            if (!valid) {
                task.destroy();

            } else {
                /// Initialize
                let requestInit: ISocketDelegatorRequest = {
                    request: { type: EAgentRequestType.Request, agentType, funcName: "Initialize", objectKey, requestKey: idGenerate(), data: initArgument },
                    response: new Subject<IAgentResponse>(),
                    waiter: SocketResolver.FreePass()
                }; this.next(requestInit);
                /// Start
                let requestStart: ISocketDelegatorRequest = {
                    request: { type: EAgentRequestType.Request, agentType, funcName: "Start", objectKey, requestKey: idGenerate(), data: null },
                    response: new Subject<IAgentResponse>(),
                    waiter: SocketResolver.FreePass()
                }; this.next(requestStart);
                /// Send all tasks
                let removing = [];
                for (let i=0; i<tasks.length; ++i) {
                    let task = tasks[i];
                    let { requestKey, funcName, data, dataKeeping, filter, outputEvent, scheduler } = task;
                    if (!dataKeeping) { removing.push(i); continue; }
                    let requestTask: ISocketDelegatorRequest = {
                        request: { type: EAgentRequestType.Request, agentType, funcName, objectKey, requestKey, data, dataKeeping, scheduler, outputEvent, filter },
                        response: new Subject<IAgentResponse>(),
                        waiter: new SocketResolver()
                    }; this.next(requestTask);
                }
                /// Clean up unnecessary tasks
                if (removing.length > 0) {
                    let newtasks = [...tasks];
                    removing.slice().reverse().forEach( (index) => newtasks.splice(index, 1) );
                    task.setValue("tasks", newtasks);
                    task.save();
                }
            }
        });
    }

    /// request remote call
    private localObjects: Map<string, any> = new Map();
    public applyServerDBTasks(tasks: ServerDBTask[])  {
        tasks.forEach( (task) => {
            let { user, agentType, initArgument, tasks, objectKey } = task.attributes;
            /// initialize main object
            let obj = jsMapAssign(this.localObjects, objectKey, () => {
                return new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(initArgument, {
                    user, objectKey, syncDB: true
                });
            });
            /// initialize functions
            let count = 0;
            tasks.forEach( (task) => {
                let { funcName, requestKey, data, filter, scheduler, dataKeeping, outputEvent } = task;
                obj[funcName](data, { requestKey, filter, scheduler, dataKeeping, outputEvent })
                    .subscribe( (result) => {}, (e) => {
                        Log.Error(LogTitle, `Send request to User <${user.id}> with "${agentType}".${funcName}() failed, ${e}`);
                    } );
                    // .subscribe( (result) => { console.log('got result: ', JSON.stringify(result)) }, (e) => {
                    //     Log.Error(LogTitle, `Send request to User <${user.id}> with "${agentType}".${funcName}() failed, ${e}`);
                    // } );
            });
        });
    }

    public Dispose() {
        [...this.objects.values()].forEach( (obj) => {
            obj.Dispose();
        });
        this.objects.clear();
    }

}