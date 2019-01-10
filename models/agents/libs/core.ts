import { Socket } from 'helpers/sockets/socket-helper';
import { EventList } from 'core/events.gen';
import { IAgentTaskFilterMapping } from './utilities/filters';
import { IAgentTaskSchedulerMapping } from './utilities/schedulers';

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

    scheduler?: ITaskFunctionScheduler;
    filter?: ITaskFunctionFilter;
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

/// Filter Signature /////////////////////////////////////////////
interface ITaskFunctionFilterSignature<T extends keyof IAgentTaskFilterMapping> {
    type: T;
    data: IAgentTaskFilterMapping[T];
}
type FSMakeDistributed<T> = T extends keyof IAgentTaskFilterMapping ? ITaskFunctionFilterSignature<T> : never;
export type ITaskFunctionFilter = FSMakeDistributed<keyof IAgentTaskFilterMapping>;
//////////////////////////////////////////////////////////////////

/// Scheduler Signature //////////////////////////////////////////
interface ITaskFunctionSchedulerSignature<T extends keyof IAgentTaskSchedulerMapping> {
    type: T;
    data: IAgentTaskSchedulerMapping[T];
}
type SSMakeDistributed<T> = T extends keyof IAgentTaskSchedulerMapping ? ITaskFunctionSchedulerSignature<T> : never;
export type ITaskFunctionScheduler = SSMakeDistributed<keyof IAgentTaskSchedulerMapping>;
//////////////////////////////////////////////////////////////////

/// Function info of Remote //////////////////////////////////////
export interface ITaskFunctionRemote {
    requestKey?: string;
    scheduler?: ITaskFunctionScheduler;
    filter?: ITaskFunctionFilter;
    /// default to no keep
    dataKeeping?: any;
    /// default to none
    outputEvent?: EventList;
}

type ExtractFunctionOb<T> = T extends (config: infer U) => infer V ? V : never;
type ExtractFunctionOp<T> = T extends (config: infer U) => infer V ? U : never;
type ExtractFunctionRemote<T> = (config: ExtractFunctionOp<T>, info: ITaskFunctionRemote) => ExtractFunctionOb<T>;
export function FunctionRemote<T extends Function>(func: T, bindTo?: any) {
    let resultFunc = func;
    if (bindTo) resultFunc = resultFunc.bind(bindTo);
    return resultFunc as any as ExtractFunctionRemote<T>;
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
    outputType?: string;
    description?: string;
}
//////////////////////////////////////////////////////////////////

/// For SocketDelegator to recognize Me //////////////////////////
export class MeUser extends Parse.User {}
//////////////////////////////////////////////////////////////////
