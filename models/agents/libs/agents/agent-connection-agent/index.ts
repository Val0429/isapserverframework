import { IFRSServiceConfig, RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Subject, Observable, Observer } from 'rxjs';
import { Log } from 'helpers/utility';
import { Objective } from '../../core';
import { Register, Base } from '../../declarations';

@Register({
    name: "Agent Connection Agent",
    description: "Used when agent first initialize, sync information back from server.",
    initialize: {
        inputType: "any"
    },
    objective: Objective.Agent
})
export class AgentConnectionAgent extends Base<any> {
    protected doStart() {
        console.log('triggered')
    }
    protected doStop() {}

    // @Agent.Function({
    //     inputType: "any",
    //     description: "Free memory."
    // })    
    // public FreeMemory(): Observable<any> {
    //     return Observable.create( (observer: Observer<any>) => {
    //         setInterval( () => {
    //             observer.next({
    //                 value: os.freemem()
    //             });
    //         }, 1000);
    //     });
    // }
}
