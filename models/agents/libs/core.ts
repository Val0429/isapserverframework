import { Socket } from 'helpers/sockets/socket-helper';

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