import { Restful } from "helpers/cgi-helpers/core";
import { SocketDelegator } from "../socket-manager/socket-delegator";
import { Log } from "helpers/utility/log";

const LogTitle: string = "ImAgent";

interface IServerConfig {
    ip: string;
    port: number;
    username: string;
    password: string;
}

export function ImAgent(config: IServerConfig) {
    return new AgentGenerator(config);
}

/**
 * Every SmartCare Agent should call this function to initialize.
 * @param config Config of SmartCare Server.
 */
export class AgentGenerator {
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
        this.socketDelegator.sjRequest.subscribe( (data) => {
            console.log('got request...', data);
        });
        this.socketDelegator.sjClose.subscribe( () => {
            Log.Info(LogTitle, "Agent Server connetion closed. Try reconnect...");
            this.tryConnect();
        });
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