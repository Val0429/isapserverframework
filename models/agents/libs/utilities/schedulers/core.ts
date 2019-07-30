/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Observable } from "rxjs";

interface IAgentTaskSchedulerConfig {
    name: string;
    inputType?: string;
    description?: string;
}
type IAgentTaskSchedulerMap = IAgentTaskSchedulerConfig & {
    classObject: any;
}

const schedulerMap: Map<string, IAgentTaskSchedulerMap> = new Map();
export function Register(config: IAgentTaskSchedulerConfig) {
    return (classObject) => {
        schedulerMap.set(config.name, {
            ...config,
            classObject
        })
    }
}
export function All() {
    return schedulerMap;
}

export function Get(name: string): IAgentTaskSchedulerMap {
    return schedulerMap.get(name);
}

export class Base<T, I = any> {
    protected config: T;
    constructor(config: T) {
        this.config = config;
    }
    public get(): Observable<I> { throw "Scheduler.get should be implemented."; }
}

export interface IAgentTaskSchedulerMapping {
    
}