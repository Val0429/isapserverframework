import { ActionParam, Socket } from "helpers/cgi-helpers/core";
import { Subject, Observable } from "rxjs";
import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus } from "../core";
import { SocketDelegator } from './socket-delegator';
export * from './socket-delegator';

const LogTitle: string = "Agent.SocketManager";

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

    private idxAgentSocketDescriptor: { [objectId: string]: IAgentSocketDescriptor } = {};
    public sjCheckedIn: Subject<Parse.User> = new Subject<Parse.User>();
    public checkIn(data: ActionParam<any>) {
        let { user, socket } = data;
        let id = user.id;
        let delegator = new SocketDelegator(socket);
        /// indexing login user
        this.idxAgentSocketDescriptor[id] = { user, delegator };
        /// hook event on it
        delegator.sjClose.subscribe( () => {
            this.idxAgentSocketDescriptor[id] = undefined;
        });
        this.sjCheckedIn.next(user);
        /// todo: Server receive request
        //delegator.request
    }

    public getSocketDelegator(user: Parse.User): SocketDelegator {
        return (this.idxAgentSocketDescriptor[user.id] || {} as any).delegator;
    }
}

