import { ISocketDelegatorRequest } from "../socket-manager";
import { RegistrationDelegator } from "../declarations";
import { IAgentRequest } from "../core";
import * as Utilities from './../utilities';

export class ObjectGenerator {
    private objects: Map<string, any> = new Map();
    next(req: ISocketDelegatorRequest) {
        let { request, response } = req;
        let { agentType, funcName, data, objectKey, requestKey } = request;

        if (funcName === 'Initialize') {
            let obj = this.objects[objectKey] = (
                this.objects[objectKey] ||
                new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(data)
                );
            response.complete();
        } else {
            /// prepare object
            let obj = this.objects[objectKey];
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