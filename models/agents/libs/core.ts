import { Socket } from 'helpers/sockets/socket-helper';
import { EventList } from 'core/events.gen';

export interface IRemoteAgent {
    agent: Parse.User;
    name?: string;
    syncDB?: boolean;
}

export interface IAgentSocketDescriptor {
    user: Parse.User;
    socket: Socket;
}

export interface IAgentRequest {
    /// e.g. FRSAgent
    agentType: string;
    /// unique key of Agent Class object.
    objectKey: string;
    /// unique key of Function request.
    requestKey: string;
    /// e.g. LiveFaces
    funcName: string;
    /// argument of Function.
    data: any;

    scheduler?: IServerScheduler;
    filter?: JSONata;
}

export enum EnumAgentResponseStatus {
    Start,
    Data,
    Error,
    Complete
}

export interface IAgentResponse {
    /// e.g. FRSAgent
    agentType: string;
    /// unique key of Agent Class object.
    objectKey: string;
    /// unique key of Function request.
    requestKey: string;
    /// e.g. LiveFaces
    funcName: string;
    /// streaming response data
    data: any;
    /// response status
    status: EnumAgentResponseStatus;
}


export type JSONata = string;

export interface IServerScheduler {
    /**
     * Key registered in scheduler.
     */
    schedulerType: string;
    /**
     * Argument that pass into this scheduler.
     */
    argument: any;
}

export interface IServerFunctionUnit {
    /**
     * Executing function of Agent Class.
     * e.g. LiveFaces
     */
    funcName: string;

    /**
     * Unique key of function request.
     */
    requestKey: string;

    /**
     * Argument that pass into this function.
     */
    argument: any;

    scheduler?: IServerScheduler;

    filter?: JSONata;

    outputEvent?: EventList;
}

export interface IFunctionRemoteInfo {
    requestKey: string;
    scheduler?: IServerScheduler;
    filter?: JSONata;
    outputEvent?: EventList;
}