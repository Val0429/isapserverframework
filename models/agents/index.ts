import { Log } from "helpers/utility";
import { Restful, ActionParam } from 'helpers/cgi-helpers/core';
import ObjectID from './bson-objectid';
import { Observable, Observer, Subject } from "rxjs";
export { ObjectID };

interface IAgentInstance {
    name?: string;
    description?: string;
    instance?: any;
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

const LogTitle = "Agent";

/**
 * Agent declaration.
 */
export namespace Agent {
    let agentMap: { [name: string]: IAgentInstance } = {};
    let base: IAgentInstance = {functions:{}};
    let delayApply: [string?, any?, IAgentFunction?] = [];

    /**
     * Register this class as SmartCare Agent.
     * @param config Provide this agent name, initializer, description
     */
    export function Register(config: IAgentRegisterConfig) {
        let { name, description, initialize } = config;
        return (instance) => {
            agentMap[name] = { name, description, instance, functions: { Initialize: initialize, ...base.functions } };

            /// try apply delayed
            let applied = [];
            for (let i=0; i<delayApply.length; ++i) {
                let obj = delayApply[i];
                let result = tryApplyFunction(obj[0], obj[1], obj[2]);
                applied.push(i);
            }
            for (let i=applied.length-1; i>=0; --i) {
                let key = applied[i];
                delayApply.splice(key, 1);
            }
        }
    }

    /**
     * Functions of SmartCare Agent should be decorated with it.
     * @param config pass Function type with inputType, and description to describe this function.
     */
    export function Function(config?: IAgentFunction) {
        return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
            /// 1) Try add this Function as a feature of class
            let addBaseFunction = (key, config) => {
                base.functions[key] = config;
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
            descriptor.value = function(this: Agent.Base<any>, args) {
                let remote = (this as any).remote as IRemoteAgent;
                // let agentType = this.constructor.name;
                let agentType = Agent.getByObject(this).name;
                if (remote) return sharedAgentJob.relay(agentType, propertyKey, args, remote);
                return oldMethod.call(this, args);
            }
            return descriptor;
        }
    }

    /**
     * classes should extend Base to be SmartCare Agent.
     */
    export class Base<T> {
        private config: T;
        private remote: IRemoteAgent;
        constructor(config: T, remote?: IRemoteAgent) {
            this.config = config;
            this.remote = remote;

            let agentType = Agent.getByObject(this).name;
            if (remote) sharedAgentJob.relay(agentType, "Initialize", config, remote).subscribe();
        }
        @Agent.Function({
            description: "Start this agent."
        })
        public Start(): Observable<void> {
            return Observable.create( async (observer: Observer<void>) => {
                await this.doStart();
                observer.complete();
            });
        }
        protected doStart() { throw "Not implemented." }

        @Agent.Function({
            description: "Stop this agent."
        })
        public Stop(): Observable<void> {
            return Observable.create( async (observer: Observer<void>) => {
                await this.doStop();
                observer.complete();
            });
        }
        protected doStop() { throw "Not implemented." }
    }

    function tryApplyFunction(key: string, instance, config: IAgentFunction) {
        let ins = getByInstance(instance);
        if (!ins) return false;
        //if (!ins) { Log.Error(LogTitle, `Should do @Agent.Register on class ${target.constructor.name}.`); return; }
        ins.functions[key] = config;
        return true;
    }

    export function get(name: string): IAgentInstance {
        return agentMap[name];
    }
    function getByInstance(instance: any): IAgentInstance {
        return Object.keys(agentMap).reduce<IAgentInstance>( (final, key) => {
            let ins = agentMap[key];
            return ins.instance === instance ? ins : final;
        }, null);
    }
    export function getByObject(object: any): IAgentInstance {
        return Object.keys(agentMap).reduce<IAgentInstance>( (final, key) => {
            let ins = agentMap[key];
            return object instanceof ins.instance ? ins : final;
        }, null);
    }

    export function all() {
        return { ...agentMap };
    }

    export interface IRemoteAgent {
        name: string;
        agent: Parse.User;
    }
    
    // export interface IAgentInitialize {
    //     id: string;
    //     agentName: 'FRS Agent',
    //     command: 'Initialize';
    // }
    
    // export interface IAgentStart {
    //     id: string;
    //     command: 'Start';
    // }
    // export interface IAgentStop {
    //     id: string;
    //     command: 'Stop';
    // }
    
    // export interface IAgentCommands {
    //     Initialize: IAgentInitialize;
    //     Start: IAgentStart;
    //     Stop: IAgentStop;
    // }
       
}


/**
 * Agent instance.
 */
export namespace Agent {
    interface IServerConfig {
        ip: string;
        port: number;
        username: string;
        password: string;
    }

    /**
     * Every SmartCare Agent should call this function to initialize.
     * @param config Config of SmartCare Server.
     */
    export function ImAgent(config: IServerConfig) {
        let objects = {};

        (async () => {
            let ioOnMessage = (data: IAgentRequest) => {
                Log.Info("ImAgent", data as any);
                let pdata = JSON.parse(data as any);
                
                if (pdata.funcName === 'Initialize') {
                    let obj = objects[pdata.objectKey] = (objects[pdata.objectKey] || new (Agent.get(pdata.agentType).instance)(pdata.data));
                } else {
                    let obj = objects[pdata.objectKey];
                    obj[pdata.funcName](pdata.data)
                        .subscribe( (data) => {
                            let response: IAgentResponse = {
                                agentType: pdata.agentType,
                                funcName: pdata.funcName,
                                requestKey: pdata.requestKey,
                                objectKey: pdata.objectKey,
                                data,
                                status: EnumAgentResponseStatus.Data
                            }

                            socket.send(JSON.stringify(response));
                        }, (err) => {
                            let response: IAgentResponse = {
                                agentType: pdata.agentType,
                                funcName: pdata.funcName,
                                requestKey: pdata.requestKey,
                                objectKey: pdata.objectKey,
                                data: err,
                                status: EnumAgentResponseStatus.Error
                            }
                            socket.send(JSON.stringify(response));
                        }, () => {
                            let response: IAgentResponse = {
                                agentType: pdata.agentType,
                                funcName: pdata.funcName,
                                requestKey: pdata.requestKey,
                                objectKey: pdata.objectKey,
                                data: null,
                                status: EnumAgentResponseStatus.Complete
                            }
                            socket.send(JSON.stringify(response));
                        });
                }

                //console.log('???', Agent)
                //let obj = objects[data.objectKey] = (objects[data.objectKey] || new (Agent.get(data.agentType).instance))
            }

            /// For an Agent,
            /// 1) Login into server
            /// 2) Connect agent socket
            let socket;
            let svr = new iSAPBasicServer(config);
            let tryConnect = async () => {
                try {
                    await svr.C("/users/login", config);
                    socket = await svr.WS("/agents/connect");
                } catch(e) {
                    Log.Info(LogTitle, "SmartCare Server connect error. try reconnect...");
                    console.log('error...');
                    setTimeout(() => {
                        tryConnect();
                    }, 1000);
                    return;
                }
                Log.Info(LogTitle, "SmartCare Server connected.");
                socket.io.on("message", ioOnMessage);
                socket.io.on("close", () => {
                    Log.Info(LogTitle, "SmartCare Server connection closed. try reconnect...");
                    tryConnect();
                });
                socket.io.on("error", () => {
                    Log.Info(LogTitle, "SmartCare Server connection error. try reconnect...");
                    tryConnect();
                });
            }
            tryConnect();
        })();
    }

    /// internal use iSAPBasicServer

    export class iSAPBasicServer extends Restful.iSAPServerBase<RestfulRequest> {

    }
    /// /users/login - All /////////////////////////////////////
    namespace UsersLoginAll {
        export interface Input {
            username: string;
            password: string;
        }
                
        export interface Output {
            sessionId: string;
            serverTime: Date;
            user: Parse.User;
        }
                
    }
    //////////////////////////////////////////////////////////////
    /// /users/logout - Post /////////////////////////////////////
    namespace UsersLogoutPost {
        export interface Input {
            sessionId: string;
        }
                
    }
    //////////////////////////////////////////////////////////////
    
    interface RestfulRequest extends Restful.ApisRequestBase {
        "Get": {
            "/users/login": [UsersLoginAll.Input, UsersLoginAll.Output, false],
        },
        "Post": {
            "/users/login": [UsersLoginAll.Input, UsersLoginAll.Output, false],
            "/users/logout": [UsersLogoutPost.Input, any, true],
        },
        "Ws": {
            "/users/alive": [any, any, true],
            "/agents/connect": [any, any, true],
        },
    }
    
}


import { Socket } from 'helpers/sockets/socket-helper';
interface IAgentDetail {
    user: Parse.User;
    socket: Socket;
}

interface IAgentRequest {
    agentType: string;
    objectKey: string;
    requestKey: string;
    funcName: string;
    data: any;
}

enum EnumAgentResponseStatus {
    Start,
    Data,
    Error,
    Complete
}

interface IAgentResponse {
    agentType: string;
    objectKey: string;
    requestKey: string;
    funcName: string;
    data: any;
    status: EnumAgentResponseStatus;
}

export let agentInstances: {
    [objectId: string]: IAgentDetail;
} = {};

let messages: {
    [requestKey: string]: Subject<IAgentResponse>;
} = {};

class AgentJob {
    public sjCheckIn: Subject<IAgentDetail> = new Subject<IAgentDetail>();

    checkIn(data: ActionParam<any>) {
        let detail = {
            user: data.user,
            socket: data.socket
        };
        detail.socket.io.on("message", (data: IAgentResponse) => {
            data = JSON.parse(data as any);
            messages[data.requestKey] && messages[data.requestKey].next(data);
        });
        agentInstances[data.user.id] = detail;
        this.sjCheckIn.next(detail);
    }

    /**
     * 
     * @param name Function name.
     * @param arg Function arg.
     * @param remote Remote info.
     */
    relay<T>(agentType: string, funcName: string, data: any, remote: Agent.IRemoteAgent): Observable<T> {
        return Observable.create( (observer: Observer<any>) => {
            let objectKey = remote.name;
            let requestKey = new ObjectID().str;
            let sjMe = messages[requestKey] = new Subject<IAgentResponse>();

            let trySend = (agent: IAgentDetail, data) => {
                agent.socket.send(JSON.stringify({
                    agentType,
                    objectKey,
                    requestKey,
                    funcName,
                    data
                }));
            }

            let id = remote.agent.id;
            let agentdetail = agentInstances[id];
            if (agentdetail) {
                trySend(agentdetail, data);
            } else {
                this.sjCheckIn
                    .filter( (v) => v.user.id === id )
                    .first()
                    .subscribe( (v) => trySend(v, data) )
            }

            /// hook on request / response
            sjMe.subscribe( (data) => {
                switch (data.status) {
                    case EnumAgentResponseStatus.Data:
                        observer.next(data.data); break;
                    case EnumAgentResponseStatus.Error:
                        observer.error(data.data); break;
                    case EnumAgentResponseStatus.Complete:
                        observer.complete();
                }
            }, (err) => {}, () => {

            });

        });
    }
}
const sharedAgentJob = new AgentJob();
export { sharedAgentJob };