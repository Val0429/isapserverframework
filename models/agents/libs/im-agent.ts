import { IAgentRequest, IAgentResponse, EnumAgentResponseStatus } from './core';
import { getAgentDescriptorByName } from './declarations';
import { Restful } from 'helpers/cgi-helpers/core';
import { Log } from 'helpers/utility/log';

const LogTitle: string = "ImAgent";
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
                let obj = objects[pdata.objectKey] = (objects[pdata.objectKey] || new (getAgentDescriptorByName(pdata.agentType).classObject)(pdata.data));
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