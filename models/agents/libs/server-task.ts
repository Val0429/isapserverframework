import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { EventList } from 'core/events.gen';

// export interface IAgentRequestInDB {
//     /// e.g. FRSAgent
//     agentType: string;
//     /// unique key of Agent Class object.
//     objectKey: string;
//     /// unique key of Function request.
//     requestKey: string;
//     /// e.g. LiveFaces
//     funcName: string;
//     /// argument of Function.
//     data: any;
// }    

type JSONata = string;

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

/// Server Task ////////////////////////////////////
export interface IServerTask {
    /**
     * This task belong to this agent.
     */
    agent: Parse.User;

    /**
     * Executing Agent Class.
     * e.g. FRSAgent
     */
    agentClass: string;

    /**
     * Unique key of this Agent Class instance.
     */
    objectKey: string;

    /**
     * Argument that feed into constructor.
     */
    initArgument: any;

    /**
     * Executing tasks.
     */
    tasks: IServerFunctionUnit[];
}
@registerSubclass() export class ServerTask extends ParseObject<IServerTask> {
    /// sync ServerTask into Server
    static async sync(config: IServerTask): Promise<ServerTask> {
        /// 1) try fetch old records.
        let task: ServerTask = await new Parse.Query(ServerTask)
            .equalTo("agent", config.agent)
            .equalTo("objectKey", config.objectKey)
            .first();
        /// found. finished
        if (task) return task;
        task = new ServerTask(config);
        await task.save();
        return task;
    }

    static async getAll(agent: Parse.User): Promise<ServerTask[]> {
        return await new Parse.Query(ServerTask)
            .equalTo("agent", agent)
            .find();
    }

    /// delete ServerTask
    async revoke() {
        await this.destroy();
    }
}
////////////////////////////////////////////////////

// do {
//     /// 1) try fetch old records.
//     let task: ServerTask = await new Parse.Query(ServerTask)
//         .equalTo("agent", remote.agent)
//         .equalTo("objectKey", remote.name)
//         .first();
//     /// found. finished
//     if (task) { this.dbInstance = task; break; }
//     task = new ServerTask({
//         agent: remote.agent,
//         agentClass: getAgentDescriptorByClassObject(classObject).name,
//         objectKey: remote.name,
//         initArgument: config,
//         tasks: []
//     });
//     await task.save();
// } while(0);
