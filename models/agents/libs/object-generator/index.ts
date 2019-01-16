import { ISocketDelegatorRequest } from "../socket-manager";
import { RegistrationDelegator } from "../declarations";
import { IAgentRequest } from "../core";
import { jsMapAssign } from "helpers/utility/jsmap-assign";
import { ServerDBTask } from "../database/server-db-task";
import { Log } from "helpers/utility";
import { DataKeeper } from "../data-keeper";
import { ObjectHolder } from "./object-holder";
import { AgentDBTask } from "../database/agent-db-task";

const LogTitle = "Agent.ObjectGenerator";

export class ObjectGenerator {
    /// Map<ObjectKey, object> pair
    private objects: Map<string, ObjectHolder> = new Map();
    public next(req: ISocketDelegatorRequest) {
        let { objectKey } = req.request;
        let obj = jsMapAssign(this.objects, objectKey, () => new ObjectHolder(objectKey));
        obj.next(req);
    }

    private localObjects: Map<string, any> = new Map();
    // /// initial local call
    // public applyAgentDBTasks(tasks: AgentDBTask[]) {
    //     tasks.forEach( (task) => {
    //         let { agentType, initArgument, tasks, objectKey } = task.attributes;
    //         /// initialize main object
    //         let obj = jsMapAssign(this.localObjects, objectKey, () => {
    //             /// transfer to ISocketDelegatorRequest
                
    //         });
    //     });
    // }

    /// request remote call
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
            tasks.forEach( (task) => {
                let { funcName, requestKey, data, filter, scheduler, dataKeeping, outputEvent } = task;
                obj[funcName](data, { requestKey, filter, scheduler, dataKeeping, outputEvent })
                    .subscribe( (result) => console.log('got result: ', result), (e) => {
                        Log.Error(LogTitle, `Send request to User <${user.id}> with "${agentType}".${funcName}() failed, ${e}`);
                    } );
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