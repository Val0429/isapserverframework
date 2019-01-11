import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';
import { Log } from 'helpers/utility';
import { Objective } from '../../core';
import * as Agent from '../../declarations';
import { IServerDBTask, ServerDBTasks } from '../../database/server-db-task';

type IOutputAssignedJobsUnit = IServerDBTask & {
    user: undefined;
}
type IOutputAssignedJobs = IOutputAssignedJobsUnit[];

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
            let server = await ServerDBTasks.getInstance(session.get("user"));
            let value: IOutputAssignedJobs = Array.from(server.getTasks().values()).map( (task) => ({ ...task.attributes, user: undefined }) );
            observer.next(value);
            observer.complete();
        });
    }
}

interface IInputAssignedJobs {
    sessionId: string;
}