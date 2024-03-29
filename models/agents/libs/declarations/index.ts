/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IRemoteAgentTask, IAgentTaskFunction, ITaskFunctionRemote, IAgentTaskRegisterConfig, EAgentRequestType, Objective, MeUser, IAgentRequest, EnumAgentResponseStatus, TimestampToken } from "../core";
import { Observable, Observer, BehaviorSubject } from "rxjs";
import { RegistrationDelegator } from "./registration-delegator";
import { SocketManager } from './../socket-manager';
export * from './registration-delegator';
import ast from 'services/ast-services/ast-client';
import { ServerDBTasks } from "../database/server-db-task";
import { Mutex, idGenerate } from "helpers/utility";
import { AgentDBTasks } from "../database/agent-db-task";
import outputEventSaver from "../database/output-event-saver";
const caller = require('caller');

const SigNotImpl: string = "Not implemented.";

/**
 * Every Agent Class should be decorated with Agent.Register.
 * @param config pass constructor info with initialize, and description to describe this Agent Class.
 */
export function Register(config: IAgentTaskRegisterConfig) {
    /// normalize config
    !config.objective && (config.objective = Objective.Server);
    return (classObject) => {
        RegistrationDelegator.Register(config, classObject);
        return classObject;
    }
}

/**
 * Every Agent Class Functions should be decorated with Agent.Function.
 * @param config pass Function type with inputType, and description to describe this function.
 */
export function Function(config?: IAgentTaskFunction) {
    let callerPath = caller();

    return <T extends object, U extends object | void>(target: any, funcName: string, descriptor: TypedPropertyDescriptor<(config?: T) => Observable<U>>) => {
        let classObject = target.constructor;
        let baseFunction: boolean = classObject === Base;
        RegistrationDelegator.Function(funcName, classObject, config, baseFunction);

        let oldMethod = descriptor.value;
        let agentType;
        descriptor.value = function(this: Base<any>, args, info?: ITaskFunctionRemote) {
            let remote = (this as any).remote as IRemoteAgentTask;
            if (!remote) return oldMethod.call(this, args);
            /// handle remote
            if (!info || !info.requestKey) info = { ...info, requestKey: idGenerate() };
            let requestKey = info.requestKey;
            let { user, objectKey } = remote;

            /// initialize agentType
            agentType = agentType || RegistrationDelegator.getAgentTaskDescriptorByInstance(this).name;

            /// todo: outputEvent

            /// make packet
            let packet: IAgentRequest = {
                type: EAgentRequestType.Request,
                agentType, funcName, data: args, objectKey, ...info, requestKey
            }

            /// save into Server DB
            if (remote.syncDB) serverSyncTask(user, packet);

            /// send delegation request
            let delegator = SocketManager.sharedInstance().getSocketDelegator(user);
            if (!delegator) return Observable.throw(`User <${user.id}> SocketDelegator not found.`);
            let remoteOb = delegator.request<U>(packet);

            /// AST: request outputType validation
            if (config.outputType) remoteOb = remoteOb.flatMap( (data) => {
                return new Promise( (resolve, reject) => {
                    ast.requestSimpleValidation({ type: config.outputType, path: callerPath }, data)
                        /// merge back timestamp
                        .then( (result) => resolve({ ...result, [TimestampToken]: (data as any)[TimestampToken] }) )
                        .catch( e => reject(e.resolve()) );
                });
            });

            /// with outputEvent, save into DB
            if (info.outputEvent) {
                remoteOb = remoteOb.do( (data) => {
                    outputEventSaver.save(user, packet, data);
                });
            }

            /// share same remote streaming
            let mainOb = remoteOb = remoteOb.share();

            /// observe created, complete status (only if syncDB)
            if (remote.syncDB) {
                remoteOb = Observable.defer( () => {
                    /// on observable complete (not error), save into Server DB
                    mainOb.subscribe({
                        error: e => null,
                        complete: () => serverSyncTask(user, {...packet, type: EAgentRequestType.Response, status: EnumAgentResponseStatus.Complete})
                    })
                    return mainOb;
                }).share();
            }

            /// return
            return remoteOb;
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
    private sjStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    constructor(config: T, remote?: IRemoteAgentTask) {
        this.config = config;
        this.remote = remote;
        /// initial remote objectKey
        if (remote) {
            if (!remote.objectKey) remote.objectKey = idGenerate();
            let { user, objectKey } = remote;
            let requestKey = idGenerate();
            let taskDescriptor = RegistrationDelegator.getAgentTaskDescriptorByInstance(this);
            let { name: agentType, objective } = taskDescriptor;
            
            /// check objective is valid
            if ( user instanceof MeUser && (objective & Objective.Agent) === 0 ) throw `<${agentType}> cannot be initialize on Agent.`;
            if ( !(user instanceof MeUser) && (objective & Objective.Server) === 0 ) throw `<${agentType}> cannot be initialize on Server.`;

            /// make request packet
            let packet: IAgentRequest = {
                type: EAgentRequestType.Request,
                agentType, funcName: "Initialize", data: config, objectKey, requestKey
            }

            /// save into Server DB
            if (remote.syncDB) serverSyncTask(user, packet);

            /// send delegation request
            let smanager = SocketManager.sharedInstance().getSocketDelegator(user);
            /// if user not online yet, don't do
            smanager && smanager.request(packet).toPromise()
              .catch( e => null );
        }

    }

    @Function({
        description: "Start this agent task."
    })
    public Start(): Observable<void> {
        if (this.sjStarted.getValue() === true) return Observable.empty();
        return Observable.create( async (observer: Observer<void>) => {
            this.sjStarted.next(true);
            await this.doStart();
            observer.complete();
        });
    }
    protected doStart() { throw SigNotImpl }

    @Function({
        description: "Stop this agent task."
    })
    public Stop(): Observable<void> {
        if (this.sjStarted.getValue() === false) return Observable.empty();
        return Observable.create( async (observer: Observer<void>) => {
            this.sjStarted.next(false);
            await this.doStop();
            observer.complete();
        });
    }
    protected doStop() { throw SigNotImpl }

    @Function({
        description: "Dispose this agent task."
    })
    public Dispose(): Observable<void> {
        return Observable.create( async (observer: Observer<void>) => {
            await this.doDispose();
            observer.complete();
        });
    }
    protected doDispose() { return this.Stop().toPromise(); }

    /**
     * Helper of Observable.create. Provide functionality to get Stopped state.
     */
    protected makeObservable<T>(callback: (observer: Observer<T>, isStopped: () => boolean) => void): Observable<T> {
        return new Observable( (observer: Observer<T>) => {
            let isStopped = () => observer.closed;
            callback(observer, isStopped);
        });
    }
}

/// private utility
async function serverSyncTask(user: Parse.User, packet) {
    let dbtask = await ServerDBTasks.getInstance(user);
    dbtask.sync(packet);
}
