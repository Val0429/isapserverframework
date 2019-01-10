import { Observable } from "rxjs";
import { Register, Base } from './../core';

interface ISchedulerInterval {
    /**
     * milliseconds of the interval.
     */
    periodMs: number;
    /**
     * milliseconds of first time execution. default to undefined (don't do)
     */
    initialDelayMs?: number;
}

@Register({
    name: "SchedulerInterval",
    description: "Schedule Function with interval.",
    inputType: "ISchedulerInterval"
})
export class SchedulerInterval extends Base<ISchedulerInterval> {
    constructor(config) {
        super(config);
        this.config.initialDelayMs =
            this.config.initialDelayMs === null || this.config.initialDelayMs === undefined ?
            this.config.periodMs : this.config.initialDelayMs;
    }
    public get(): Observable<any> {
        return Observable.timer( this.config.initialDelayMs, this.config.periodMs );
    }
}

declare module "models/agents/libs/utilities/schedulers/core" {
    export interface IAgentTaskSchedulerMapping {
        SchedulerInterval: ISchedulerInterval;
    }    
}
