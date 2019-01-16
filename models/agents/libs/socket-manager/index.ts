import { ActionParam, Socket } from "helpers/cgi-helpers/core";
import { Subject, Observable } from "rxjs";
import { IAgentRequest, IAgentResponse, IAgentStreaming, EAgentRequestType, EnumAgentResponseStatus, MeUser } from "../core";
import { SocketDelegator, ISocketDelegatorRequest } from './socket-delegator';
import { Log } from "helpers/utility/log";
import { RegistrationDelegator } from "../declarations/registration-delegator";
import { ObjectGenerator } from "../object-generator";
import { ServerDBTask, ServerDBTasks } from "../database/server-db-task";
export * from './socket-delegator';

//const LogTitle: string = "Agent.SocketManager";
const LogTitle: string = "ImServer";

interface IAgentSocketDescriptor {
    user: Parse.User;
    delegator: SocketDelegator;
}

type UserId = string;

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
    private objectGenerators: Map<UserId, ObjectGenerator> = new Map();
    /// Only called by Server.
    public checkIn(data: ActionParam<any>) {
        let { user, socket } = data;
        let id = user.id;
        let myGenerator = new ObjectGenerator();
        let delegator = new SocketDelegator(socket);
        /// indexing login user
        this.idxAgentSocketDescriptor.set(id, { user, delegator });
        this.objectGenerators.set(id, myGenerator);
        /// hook event on it
        delegator.sjClose.subscribe( () => {
            this.idxAgentSocketDescriptor.delete(id);
            myGenerator.Dispose();
            this.objectGenerators.delete(id);
        });
        this.sjCheckedIn.next(user);
        /// Server receive request
        delegator.sjRequest.subscribe( (data) => {
            Log.Info(LogTitle, `Receive request: ${JSON.stringify(data.request)}`);
            myGenerator.next(data);
        }, e => null);
    }

    public async applyDBTasks(user: Parse.User) {
        let myGenerator = this.objectGenerators.get(user.id);
        if (!myGenerator) return;
        myGenerator.applyServerDBTasks( Array.from( (await ServerDBTasks.getInstance(user)).getTasks().values() ) );
    }

    /// for Agent client to register itself
    private meDelegator: SocketDelegator;
    public registerMe(delegator: SocketDelegator) {
        this.meDelegator = delegator;
    }

    public getSocketDelegator(user: Parse.User): SocketDelegator {
        if (user instanceof MeUser) return this.meDelegator;
        return (this.idxAgentSocketDescriptor.get(user.id) || {} as any).delegator;
    }
}

