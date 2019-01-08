import { ActionParam, Socket } from "helpers/cgi-helpers/core";
import { Subject, Observable } from "rxjs";
import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus, MeUser } from "../core";
import { SocketDelegator, ISocketDelegatorRequest } from './socket-delegator';
import { Log } from "helpers/utility/log";
import { RegistrationDelegator } from "../declarations/registration-delegator";
export * from './socket-delegator';

//const LogTitle: string = "Agent.SocketManager";
const LogTitle: string = "ImServer";

interface IAgentSocketDescriptor {
    user: Parse.User;
    delegator: SocketDelegator;
}

/// ImServer.
/// This class handle all incoming socket / socket send receive delegation.
export class SocketManager {
    private constructor() {}
    private static instance: SocketManager;
    public static sharedInstance(): SocketManager {
        return SocketManager.instance || (SocketManager.instance = new SocketManager());
    }

    private idxAgentSocketDescriptor = new Map<string, IAgentSocketDescriptor>();
    public sjCheckedIn: Subject<Parse.User> = new Subject<Parse.User>();
    public checkIn(data: ActionParam<any>) {
        let { user, socket } = data;
        let id = user.id;
        let delegator = new SocketDelegator(socket);
        /// indexing login user
        this.idxAgentSocketDescriptor[id] = { user, delegator };
        /// hook event on it
        delegator.sjClose.subscribe( () => {
            this.idxAgentSocketDescriptor.delete(id);
        });
        this.sjCheckedIn.next(user);
        /// todo: Server receive request
        delegator.sjRequest.subscribe( (data) => {
            Log.Info(LogTitle, `Receive request: ${JSON.stringify(data.request)}`);
            this.serverRequestHandler(data);
        }, e => null);
    }

    /// for Agent client to register itself
    private meDelegator: SocketDelegator;
    public registerMe(delegator: SocketDelegator) {
        this.meDelegator = delegator;
    }

    public getSocketDelegator(user: Parse.User): SocketDelegator {
        if (user instanceof MeUser) return this.meDelegator;
        return (this.idxAgentSocketDescriptor[user.id] || {} as any).delegator;
    }

    /// private helper
    /// Server handle request start from Agent
    private objects: Map<string, any> = new Map();
    private serverRequestHandler(req: ISocketDelegatorRequest) {
        let { request, response } = req;
        let { agentType, funcName, data, objectKey, requestKey } = request;
        if (funcName === 'Initialize') {
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

