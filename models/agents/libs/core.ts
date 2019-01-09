import { Socket } from 'helpers/sockets/socket-helper';
import { EventList } from 'core/events.gen';

/// Streaming Request / Response /////////////////////////////////
export type JSONata = string;

export enum EAgentRequestType {
    Request,
    Response
}

export interface IAgentRequest {
    type: EAgentRequestType.Request;
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

    scheduler?: any;
    filter?: JSONata;
    dataKeeping?: any;
}

export enum EnumAgentResponseStatus {
    Data,
    Error,
    Complete
}

export interface IAgentResponse {
    type: EAgentRequestType.Response;
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

export type IAgentStreaming = IAgentRequest | IAgentResponse;
//////////////////////////////////////////////////////////////////

/// Constructor signature of Remote //////////////////////////////
export interface IRemoteAgentTask {
    user: Parse.User;
    objectKey?: string;
    syncDB?: boolean;
}
//////////////////////////////////////////////////////////////////

/// Function info of Remote //////////////////////////////////////
export interface ITaskFunctionRemote {
    requestKey?: string;
    scheduler?: any;
    filter?: JSONata;
    /// default to no keep
    dataKeeping?: any;
    /// default to none
    outputEvent?: EventList;
    /// to hint for observable stop
    isStopped?: () => boolean;
}
//////////////////////////////////////////////////////////////////

/// Agent Tasks Registration /////////////////////////////////////
export interface IAgentTaskDescriptor {
    name?: string;
    initialize?: IAgentTaskFunction;
    description?: string;
    objective?: Objective;
    classObject?: any;
    functions: { [name: string]: IAgentTaskFunction };
}

export enum Objective {
    Server = 0x0001,
    Agent = 0x0002
}

export interface IAgentTaskRegisterConfig {
    /**
     * Human recognizible name. e.g. FRS Agent Task.
     */
    name: string;
    /**
     * type of constructor argument.
     */
    initialize: IAgentTaskFunction;
    /**
     * Human readable detail to describe this Agent Task.
     */
    description?: string;
    /**
     * Target to send this task. default to Server
     */
    objective?: Objective;
}

export interface IAgentTaskFunction {
    inputType?: string;
    description?: string;
}
//////////////////////////////////////////////////////////////////

/// For SocketDelegator to recognize Me //////////////////////////
export class MeUser extends Parse.User {}
//////////////////////////////////////////////////////////////////
