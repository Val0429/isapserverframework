import { ISocketDelegatorRequest } from "../socket-manager";
import { RegistrationDelegator } from "../declarations";
import { IAgentRequest } from "../core";
import * as Utilities from './../utilities';
import { jsMapAssign } from "helpers/utility/jsmap-assign";
import { ServerDBTask } from "../database/server-db-task";
import { Log } from "helpers/utility";

const LogTitle = "Agent.ObjectGenerator";

export class ObjectGenerator {
    /// Map<ObjectKey, object> pair
    private objects: Map<string, any> = new Map();
    public next(req: ISocketDelegatorRequest) {
        let { request, response } = req;
        let { agentType, funcName, data, objectKey, requestKey } = request;

        if (funcName === 'Initialize') {
            let obj = jsMapAssign(this.objects, objectKey, () => new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(data));
            response.complete();
        } else {
            /// prepare object
            let obj = this.objects.get(objectKey);
            if (!obj) throw `<${agentType}> with ID <${objectKey}> not exists.`;
            let o, originalFunction;
            o = originalFunction = obj[funcName](data);
            /// prepare scheduler
            let scheduler = this.getScheduler(request);
            if (scheduler) o = scheduler().mergeMap( () => originalFunction );
            /// prepare filter
            let filter = this.getFilter(request);
            if (filter) o = o.pipe( filter );
            /// execute
            let subscription = o.subscribe(
                    (data) => response.next(data),
                    (err) => response.error(err),
                    () => response.complete()
                );
            /// stop / unsubscribe function when error / disconnected / complete
            let handleStop = () => { subscription.unsubscribe(); }
            response.subscribe({ error: () => handleStop(), complete: () => handleStop() });
        }
    }

    /// request remote call
    public applyDBTasks(tasks: ServerDBTask[])  {
        tasks.forEach( (task) => {
            let { user, agentType, initArgument, tasks, objectKey } = task.attributes;
            /// initialize main object
            let obj = jsMapAssign(this.objects, objectKey, () => {
                return new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(initArgument, {
                    user, objectKey, syncDB: true
                });
            });
            /// initialize functions
            tasks.forEach( (task) => {
                let { funcName, requestKey, data, filter, scheduler, dataKeeping, outputEvent } = task;
                obj[funcName](data, { requestKey, filter, scheduler, dataKeeping, outputEvent })
                    .subscribe( (result) => console.log('got result: ', result), (e) => {
                        Log.Error(LogTitle, `Send request to User <${user.id}> with "${agentType}".${funcName} failed, ${e}`);
                    } );
            });
        });
    }

    public Dispose() {
        [...this.objects.values()].forEach( (obj) => {
            obj.Stop();
            obj.Dispose();
        });
        this.objects.clear();
    }

    private getFilter(request: IAgentRequest) {
        let filter = request.filter;
        if (!filter) return;
        let o = new (Utilities.Filters.Get((filter as any).type).classObject)((filter as any).data);
        return o.get.bind(o);
    }

    private getScheduler(request: IAgentRequest) {
        let scheduler = request.scheduler;
        if (!scheduler) return;
        let o = new (Utilities.Scheduler.Get((scheduler as any).type).classObject)((scheduler as any).data);
        return o.get.bind(o);
    }
}