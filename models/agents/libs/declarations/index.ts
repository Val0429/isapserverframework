import { IRemoteAgentTask, IAgentTaskFunction, ITaskFunctionRemote, IAgentTaskRegisterConfig, EAgentRequestType } from "../core";
import { Observable, Observer } from "rxjs";
import { RegistrationDelegator } from "./registration-delegator";
import { SocketManager } from './../socket-manager';
import { idGenerate } from "../id-generator";
export * from './registration-delegator';

const SigNotImpl: string = "Not implemented.";

/**
 * Every Agent Class should be decorated with Agent.Register.
 * @param config pass constructor info with initialize, and description to describe this Agent Class.
 */
export function Register(config: IAgentTaskRegisterConfig) {
    let { name, initialize, description } = config;
    return (classObject) => {
        let CO: typeof Base = classObject;
        /// overwrite class
        let newClass = class extends CO<any> {
            // dbInstance: ServerTask;
            constructor(config, remote: IRemoteAgentTask) {
                super(config, remote);
                /// handle syncDB here.
                // if (remote.syncDB) {
                //     this.dbInstance = ServerTask.sync({
                //         agent: remote.agent,
                //         agentClass: name,
                //         objectKey: remote.name,
                //         initArgument: config,
                //         tasks: []
                //     });
                // }
            }

            Dispose(): Observable<void> {
                // this.dbInstance && this.dbInstance.revoke();
                return super.Dispose();
            }
        } as any;
        RegistrationDelegator.Register(config, newClass);
        return newClass;
    }
}

/**
 * Every Agent Class Functions should be decorated with Agent.Function.
 * @param config pass Function type with inputType, and description to describe this function.
 */
export function Function(config?: IAgentTaskFunction) {
    return (target: any, funcName: string, descriptor: PropertyDescriptor) => {
        let classObject = target.constructor;
        let baseFunction: boolean = classObject === Base;
        RegistrationDelegator.Function(funcName, classObject, config, baseFunction);

        let oldMethod = descriptor.value;
        let agentType;
        descriptor.value = function(this: Base<any>, args, info?: ITaskFunctionRemote) {
            let remote = (this as any).remote as IRemoteAgentTask;
            if (!remote) return oldMethod.call(this, args);
            /// handle remote
            if (!info) info = { requestKey: idGenerate() };
            /// initialize agentType
            agentType = agentType || RegistrationDelegator.getAgentTaskDescriptorByInstance(this).name;
            // /// save into db
            // let funcInfo = {
            //     argument: args,
            //     funcName,
            //     ...info
            // }
            // !baseFunction && ((this as any).dbInstance as ServerTask).syncFunction(funcInfo);
            /// todo: outputEvent
            return SocketManager.sharedInstance().getSocketDelegator(remote.user).request({
                type: EAgentRequestType.Request,
                agentType, funcName, data: args, objectKey: remote.objectKey, ...info
            }).share();
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
    private remote: IRemoteAgentTask;
    constructor(config: T, remote?: IRemoteAgentTask) {
        this.config = config;
        this.remote = remote;
        /// initial remote objectKey
        if (remote) {
            if (!remote.objectKey) remote.objectKey = idGenerate();
            let requestKey = idGenerate();
            let agentType = RegistrationDelegator.getAgentTaskDescriptorByInstance(this).name;
            SocketManager.sharedInstance().getSocketDelegator(remote.user).request({
                type: EAgentRequestType.Request,
                agentType, funcName: "Initialize", data: config, objectKey: remote.objectKey, requestKey
            }).toPromise()
              .catch( e => null );
        }
    }

    @Function({
        description: "Start this agent task."
    })
    public Start(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doStart();
            observer.complete();
        });
    }
    protected doStart() { throw SigNotImpl }

    @Function({
        description: "Stop this agent task."
    })
    public Stop(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doStop();
            observer.complete();
        });
    }
    protected doStop() { throw SigNotImpl }

    public Dispose(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doDispose();
            observer.complete();
        });
    }
    protected doDispose() { return this.Stop().toPromise(); }

}