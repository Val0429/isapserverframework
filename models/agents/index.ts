import { Log } from "helpers/utility";
import { Restful } from 'helpers/cgi-helpers/core';
import ObjectID from './bson-objectid';
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

/**
 * Agent declaration.
 */
export namespace Agent {
    const LogTitle = "Agent";
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
            let addBaseFunction = (key, config) => {
                base.functions[key] = config;
                Object.keys(agentMap).forEach( (v) => {
                    let ins = agentMap[v];
                    ins.functions[key] = config;
                })
            }
            if (target.constructor === Base) { addBaseFunction(propertyKey, config); return; }

            let tryApply: boolean = tryApplyFunction(propertyKey, target.constructor, config);
            if (tryApply === false) delayApply.push( [propertyKey, target.constructor, config] );
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
        }
        @Agent.Function({
            description: "Start this agent."
        })
        public Start() { throw "Not implemented." }
        protected doStart() { throw "Not implemented." }

        @Agent.Function({
            description: "Stop this agent."
        })
        public Stop() { throw "Not implemented." }
        protected doStop() { throw "Not implemented." }
    }

    function tryApplyFunction(key: string, instance, config: IAgentFunction) {
        let ins = getByInstance(instance);
        if (!ins) return false;
        //if (!ins) { Log.Error(LogTitle, `Should do @Agent.Register on class ${target.constructor.name}.`); return; }
        ins.functions[key] = config;
        return true;
    }

    function get(name: string): IAgentInstance {
        return agentMap[name];
    }
    function getByInstance(instance: any): IAgentInstance {
        return Object.keys(agentMap).reduce<IAgentInstance>( (final, key) => {
            let ins = agentMap[key];
            return ins.instance === instance ? ins : final;
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
        (async () => {
            let svr = new iSAPBasicServer(config);
            console.log('try socket')
            let socket = await svr.WS("/users/alive");
            console.log('socket?', socket)
        })();
    }

    /// internal use iSAPBasicServer

    export class iSAPBasicServer extends Restful.iSAPAutoServerBase<RestfulRequest> {

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
        },
    }
    
}