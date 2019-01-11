import { Restful } from "helpers/cgi-helpers/core";
import { Log } from "helpers/utility/log";
import { RegistrationDelegator } from "../declarations";
import { SocketManager, SocketDelegator, ISocketDelegatorRequest } from "../socket-manager";
import { AgentConnectionAgent } from "../agents/agent-connection-agent";
import { MeUser, IAgentRequest } from "../core";
import { ObjectGenerator } from "../object-generator";

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
    private objectGenerator: ObjectGenerator = new ObjectGenerator();
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
        SocketManager.sharedInstance().registerMe(this.socketDelegator);

        /// everytime connected, send request to server
        this.initialRequestToServer();

        /// handle message
        /// todo: handle request error. maybe no need
        this.socketDelegator.sjRequest.subscribe( (data) => {
            Log.Info(LogTitle, `Receive request: ${JSON.stringify(data.request)}`);
            this.objectGenerator.next(data);
        }, e => null);
        this.socketDelegator.sjClose.subscribe( () => {
            Log.Info(LogTitle, "Agent Server connetion closed. Try reconnect...");
            this.tryConnect();
        });
    }

    /// client send request
    private async initialRequestToServer() {
        let test = new AgentConnectionAgent(null, {
            user: new MeUser()
        });
        await test.Start().toPromise();
        /// todo: send request to get back running tasks
        test.AssignedJobs({ sessionId: this.server.getSessionId() })
            .subscribe( (data) => {
                console.log('client get results...', data);
            })
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