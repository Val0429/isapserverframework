import { Restful } from "helpers/cgi-helpers/core";
import { SocketDelegator, ISocketDelegatorRequest } from "../socket-manager/socket-delegator";
import { Log } from "helpers/utility/log";
import { RegistrationDelegator } from "../declarations";

const LogTitle: string = "ImAgent";

interface IServerConfig {
    ip: string;
    port: number;
    username: string;
    password: string;
}

/**
 * Every SmartCare Agent should call this function to initialize.
 * @param config Config of Agent Server.
 */
export function ImAgent(config: IServerConfig) {
    return new AgentGenerator(config);
}

/**
 * As its name, for Agent auto components generator.
 */
class AgentGenerator {
    private config: IServerConfig;
    private server: iSAPBasicServer;
    private socketDelegator: SocketDelegator;
    constructor(config: IServerConfig) {
        this.config = config;
        this.server = new iSAPBasicServer(config);
        this.tryConnect();
    }

    private async tryConnect() {
        try {
            await this.server.C("/users/login", this.config);
            let socket = await this.server.WS("/agents/connect");
            this.socketDelegator = new SocketDelegator(socket);
        } catch(e) {
            Log.Info(LogTitle, "Agent Server connect error. Try reconnect...");
            setTimeout( () => {
                this.tryConnect();
            }, 1000);
            return;
        }
        Log.Info(LogTitle, "Agent Server connected.");

        /// handle message
        /// todo: handle request error
        this.socketDelegator.sjRequest.subscribe( (data) => {
            console.log('got request...', data);
            this.requestHandler(data);
        }, (err) => {}, () => {});
        this.socketDelegator.sjClose.subscribe( () => {
            Log.Info(LogTitle, "Agent Server connetion closed. Try reconnect...");
            this.tryConnect();
        });
    }

    private objects: Map<string, any> = new Map();
    private requestHandler(req: ISocketDelegatorRequest) {
        let { request, response } = req;
        let { agentType, funcName, data, objectKey, requestKey } = request;
        if (request.funcName === 'Initialize') {
            let obj = this.objects[objectKey] = (
                this.objects[objectKey] ||
                new (RegistrationDelegator.getAgentTaskDescriptorByName(agentType).classObject)(data)
                );
        } else {
            let obj = this.objects[objectKey];
            if (!obj) throw `<${agentType}> with ID <${objectKey}> not exists.`;
            obj[funcName](data)
                .subscribe(
                    (data) => response.next(data),
                    (err) => response.error(err),
                    () => response.complete()
                );
        }
    }
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