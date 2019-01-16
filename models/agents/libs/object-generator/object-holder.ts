import { ISocketDelegatorRequest } from "../socket-manager/socket-delegator";
import { RegistrationDelegator } from "../declarations/registration-delegator";
import { IAgentRequest } from "../core";
import * as Utilities from './../utilities';
import { DataKeeper } from "../data-keeper";

interface IObjectHolderFunction {
    requestKey: string;
    request: ISocketDelegatorRequest;
    dataKeeper?: DataKeeper;
}

export class ObjectHolder {
    private objectKey: string;
    constructor(objectKey: string) {
        this.objectKey = objectKey;
    }

    public Dispose() {
        if (!this.instance) return;
        this.instance.Stop().toPromise();
        this.instance.Dispose().toPromise();
    }

    private instance;
    private functionMap: Map<string, IObjectHolderFunction> = new Map();
    next(req: ISocketDelegatorRequest) {
        let { request, response } = req;
        let { agentType, funcName, data, objectKey, requestKey, dataKeeping } = request;

        if (funcName === 'Initialize') {
            if (!this.instance) this.instance = new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(data);
            response.complete();
        } else {
            let keepedFunction = this.functionMap.get(requestKey);
            if (keepedFunction) {
                keepedFunction.dataKeeper.replace(req);
                return;
            }
            /// prepare object
            let obj = this.instance;
            if (!obj) throw `<${agentType}> with ID <${objectKey}> not exists.`;
            let o, originalFunction;
            o = originalFunction = obj[funcName](data);
            /// prepare scheduler
            let scheduler = this.getScheduler(request);
            if (scheduler) o = scheduler().mergeMap( () => originalFunction );
            /// until stopped
            o = o.takeUntil(obj.sjStarted.filter(v=>!v).first());
            /// prepare filter
            let filter = this.getFilter(request);
            if (filter) o = o.pipe( filter );
            /// prepare datakeeping
            let dataKeeper = new DataKeeper({ request: req, rule: dataKeeping, requestKey });
            /// when finished, remove function.
            dataKeeper.sjCompleted.filter(v=>v).first().subscribe( () => this.functionMap.delete(requestKey) );
            /// execute
            let subscription = o.subscribe(dataKeeper);
            /// stop / unsubscribe function when error / disconnected / complete
            let handleStop = () => { subscription.unsubscribe(); }
            /// should not stop with datakeeping rule
            if (!dataKeeping) {
                response.subscribe({ error: () => handleStop(), complete: () => handleStop() });
            }
            /// keep function
            this.functionMap.set(requestKey, {
                requestKey,
                request: req,
                dataKeeper
            });
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