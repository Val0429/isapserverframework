import { IRemoteAgent } from './core';
import { Job } from './job';
import { ServerTask } from './server-task';
const sharedAgentJob = Job.sharedInstance();
import { Observable, Observer } from "rxjs";
import { Mutex } from 'helpers/utility';
import * as shortid from './shortid';

/**
 * todo
 * sharedAgentJob
 */

type AgentMapType = { [name: string]: IAgentDescriptor };
const agentMap: AgentMapType = {};
const agentBase: IAgentDescriptor = {functions:{}};
/// technique to handle delay between decorators
const delayApply: [string, any, IAgentFunction][] = [];

interface IAgentDescriptor {
    name?: string;
    description?: string;
    classObject?: any;
    functions: { [name: string]: IAgentFunction };
}

interface IAgentFunction {
    inputType?: string;
    description?: string;
}

interface IAgentRegisterConfig {
    name: string;
    initialize: IAgentFunction;
    description?: string;
}

/**
 * Every Agent Class should be decorated with Agent.Register.
 * @param config pass constructor info with initialize, and description to describe this Agent Class.
 */
export function Register(config: IAgentRegisterConfig) {
    let { name, description, initialize } = config;
    return (classObject) => {
        let CO: typeof Base = classObject;
        agentMap[name] = { name, description, classObject, functions: { Initialize: initialize, ...agentBase.functions } };

        /// try apply delayed, after register complete
        let applied = [];
        for (let i=0; i<delayApply.length; ++i) {
            let [key, classObject, config] = delayApply[i];
            let result = tryApplyFunction(key, classObject, config);
            applied.push(i);
        }
        for (let i=applied.length-1; i>=0; --i) {
            let key = applied[i];
            delayApply.splice(key, 1);
        }

        /// overwrite class
        return class extends CO<any> {
            dbMtx: Mutex = new Mutex();
            dbInstance: ServerTask;
            constructor(config, remote: IRemoteAgent) {
                super(config, remote);
                /// handle syncDB here.
                if (remote.syncDB) (async () => {
                    await this.dbMtx.acquire();

                    this.dbInstance = await ServerTask.sync({
                        agent: remote.agent,
                        agentClass: getAgentDescriptorByClassObject(classObject).name,
                        objectKey: remote.name,
                        initArgument: config,
                        tasks: []
                    });

                    this.dbMtx.release();
                })();
            }

            Dispose(): Observable<void> {
                this.dbInstance && this.dbInstance.revoke();
                return super.Dispose();
            }
        } as any;
    }
}


/**
 * Every Agent Class Functions should be decorated with Agent.Function.
 * @param config pass Function type with inputType, and description to describe this function.
 */
export function Function(config?: IAgentFunction) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        /// 1) Try add this Function as a feature of class
        let addBaseFunction = (key, config) => {
            agentBase.functions[key] = config;
            /// todo remove. Base Functions should not mix with normal Functions.
            Object.keys(agentMap).forEach( (v) => {
                let ins = agentMap[v];
                ins.functions[key] = config;
            })
        }
        if (target.constructor === Base) {
            addBaseFunction(propertyKey, config);
        } else {
            let tryApply: boolean = tryApplyFunction(propertyKey, target.constructor, config);
            if (tryApply === false) delayApply.push( [propertyKey, target.constructor, config] );
        }

        /// 2) Wrap this Function with another
        let oldMethod = descriptor.value;
        descriptor.value = function(this: Base<any>, args) {
            let remote = (this as any).remote as IRemoteAgent;
            // let agentType = this.constructor.name;
            let agentType = getAgentDescriptorByInstance(this).name;
            if (remote) return sharedAgentJob.relay(agentType, propertyKey, args, remote);
            return oldMethod.call(this, args);
        }
        return descriptor;
    }
}

/**
 * Every Agent Classes should extend Base.
 * These Functions must be overwritten:
 * doStart(): Observable<void> | Promise<Observable<void>>;
 * doStop(): Observable<void> | Promise<Observable<void>>;
 * 
 * These Function is optionally overwritable:
 * doDispose(): Observable<void> | Promise<Observable<void>>;  /// default to call doStop()
 */
export class Base<T> {
    private config: T;
    private remote: IRemoteAgent;
    constructor(config: T, remote?: IRemoteAgent) {
        this.config = config;
        this.remote = remote;
        /// initial remote name
        if (this.remote && !this.remote.name) {
            this.remote.name = shortid.generate();
        }

        let agentType = getAgentDescriptorByInstance(this).name;
        if (remote) sharedAgentJob.relay(agentType, "Initialize", config, remote).subscribe();
    }
    @Function({
        description: "Start this agent."
    })
    public Start(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doStart();
            observer.complete();
        });
    }
    protected doStart() { throw "Not implemented." }

    @Function({
        description: "Stop this agent."
    })
    public Stop(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doStop();
            observer.complete();
        });
    }
    protected doStop() { throw "Not implemented." }

    @Function({
        description: "Dispose this agent."
    })
    public Dispose(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doDispose();
            observer.complete();
        });
    }
    protected doDispose() { return this.Stop().toPromise(); }
}

export function getAgentDescriptorByName(name: string): IAgentDescriptor {
    return agentMap[name];
}
export function getAgentDescriptorByClassObject(classObject: typeof Base): IAgentDescriptor {
    return Object.keys(agentMap).reduce<IAgentDescriptor>( (final, key) => {
        let ins = agentMap[key];
        return ins.classObject === classObject ? ins : final;
    }, null);
}
export function getAgentDescriptorByInstance(instance: Base<any>): IAgentDescriptor {
    return Object.keys(agentMap).reduce<IAgentDescriptor>( (final, key) => {
        let ins = agentMap[key];
        return instance instanceof ins.classObject ? ins : final;
    }, null);
}
export function getAllAgentDescriptors(): AgentMapType {
    return { ...agentMap };
}

/// private helpers
function tryApplyFunction(key: string, instance, config: IAgentFunction) {
    let ins = getAgentDescriptorByClassObject(instance);
    if (!ins) return false;
    //if (!ins) { Log.Error(LogTitle, `Should do @Agent.Register on class ${target.constructor.name}.`); return; }
    ins.functions[key] = config;
    return true;
}
