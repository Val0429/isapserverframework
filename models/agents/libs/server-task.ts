import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IServerFunctionUnit } from './core';
import { Mutex } from 'helpers/utility';

// export interface IServerFunctionUnit {
//     /**
//      * Executing function of Agent Class.
//      * e.g. LiveFaces
//      */
//     funcName: string;

//     /**
//      * Unique key of function request.
//      */
//     requestKey: string;

//     /**
//      * Argument that pass into this function.
//      */
//     argument: any;

//     scheduler?: IServerScheduler;

//     filter?: JSONata;

//     outputEvent?: EventList;
// }

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

// var attributes = this.attributes;
// if (typeof this.constructor.readOnlyAttributes === 'function') {
//   var readonly = this.constructor.readOnlyAttributes() || [];
//   // Attributes are frozen, so we have to rebuild an object,
//   // rather than delete readonly keys
//   var copy = {};
//   for (var a in attributes) {
//     if (readonly.indexOf(a) < 0) {
//       copy[a] = attributes[a];
//     }
//   }
//   attributes = copy;
// }
// if (clone.set) {
//   clone.set(attributes);
// }

@registerSubclass() export class ServerTask extends ParseObject<IServerTask> {
    private mtx: Mutex = new Mutex();
    private static map: { [objectKey: string]: ServerTask } = {};

    /// sync ServerTask into Server
    static sync(config: IServerTask): ServerTask {
        let task: ServerTask = new ServerTask(config);
        (async () => {
            await task.mtx.acquire();
            /// 1) try fetch old records
            let entity: ServerTask = await new Parse.Query(ServerTask)
                .equalTo("agent", config.agent)
                .equalTo("objectKey", config.objectKey)
                .first();
            /// found. finished
            if (entity) {
                let attrs = entity.attributes;
                let ctor = entity.constructor as any;
                if (typeof ctor.readOnlyAttributes === 'function') {
                    var readonly = ctor.readOnlyAttributes() || [];
                    var copy: any = {};
                    for (var a in attrs) if (readonly.indexOf(a) < 0) copy[a] = attrs[a];
                }
                attrs = copy;
                task.set(attrs);
                task.id = entity.id;
            } else {
                await task.save();
            }
            task.mtx.release();
        })();
        this.map[config.objectKey] = task;
        return task;
    }

    async syncFunction(config: IServerFunctionUnit): Promise<void> {
        await this.mtx.acquire();
        let tasks = [...this.attributes.tasks];
        let idx = tasks.findIndex((task) => task.requestKey === config.requestKey);
        if (idx >= 0) {
            tasks = [...tasks.slice(0, idx), config, ...tasks.slice(idx+1, tasks.length)];
        } else tasks.push(config);
        this.set("tasks", tasks);
        await this.save();
        this.mtx.release();
    }

    async revokeFunction(config: IServerFunctionUnit): Promise<void> {
        await this.mtx.acquire();
        let tasks = [...this.attributes.tasks];
        let idx = tasks.findIndex((task) => task.requestKey === config.requestKey);
        if (idx >= 0) {
            tasks = [...tasks.slice(0, idx), ...tasks.slice(idx+1, tasks.length)];
            this.set("tasks", tasks);
            await this.save();
        }
        this.mtx.release();
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
