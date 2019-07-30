/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';
import { Log } from 'helpers/utility';
import { Objective, IAgentRequest } from '../../core';
import * as Agent from '../../declarations';
import { IServerDBTask, ServerDBTasks } from '../../database/server-db-task';
import { SocketManager } from '../../socket-manager';

// type IOutputAssignedJobsUnit = IServerDBTask & {
//     user: undefined;
// }
interface IOutputAssignedJobsUnit {
    objectKey: string;
    agentType: string;
    initArgument: any;
    tasks: IAgentRequest[];
}
interface IOutputAssignedJobs {
    data: IOutputAssignedJobsUnit[];
}

/**
 * Support Agent to call Server for its AssignJobs.
 * And also call SocketManager(ImServer) to apply DB tasks if flags "sendRequest".
 */

@Agent.Register({
    name: "Agent Connection Agent",
    description: "Used when agent first initialize, sync information back from server.",
    objective: Objective.Agent
})
export class AgentConnectionAgent extends Agent.Base<any> {
    protected doStart() {}
    protected doStop() {}

    @Agent.Function({
        description: "Agent ask Server for all assign jobs.",
        inputType: "IInputAssignedJobs",
        outputType: "IOutputAssignedJobs"
    })
    public AssignedJobs(input: IInputAssignedJobs): Observable<IOutputAssignedJobs> {
        return this.makeObservable( async (observer, isStopped) => {
            let { sessionId } = input;
            /// get session instance
            let session = await new Parse.Query("_Session")
                .include("user")
                .first({sessionToken: sessionId}) as Parse.Session;
            if (!session) return observer.error("Session not exists.");

            /// make query
            let user = session.get("user");
            let server = await ServerDBTasks.getInstance(user);
            let dbtasks = Array.from(server.getTasks().values());
            
            /// apply db tasks
            if (input.sendRequest) SocketManager.sharedInstance().applyDBTasks(user);

            let data: IOutputAssignedJobsUnit[] = dbtasks.map( (task) => ({ ...task.attributes, user: undefined }) );
            observer.next({data});
            observer.complete();
        });
    }
}

interface IInputAssignedJobs {
    sessionId: string;
    sendRequest?: boolean;
}