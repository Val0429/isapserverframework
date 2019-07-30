/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { IAgentTaskRegisterConfig, IAgentTaskDescriptor, IAgentTaskFunction } from "../core";

type AgentTaskMapType = { [name: string]: IAgentTaskDescriptor };

/**
 * Registration of Agent Tasks / Task Functions.
 * Also getter of TaskDescriptors.
 */
export class RegistrationDelegator {
    private static agentMap: AgentTaskMapType = {};
    private static agentBase: IAgentTaskDescriptor = {functions:{}};
    private static delayApply: [string, any, IAgentTaskFunction][] = [];

    public static Register(config: IAgentTaskRegisterConfig, classObject: any) {
        let { name, initialize, description, objective } = config;
        this.agentMap[name] = {
            name, initialize, description, objective, classObject, functions: { Initialize: initialize, ...this.agentBase.functions }
        }
        this.DelayApplyFunction();
    }

    public static Function(name: string, classObject: any, config: IAgentTaskFunction, baseFunction: boolean) {
        if (baseFunction) {
            this.agentBase.functions[name] = config;
            /// todo remove. Base Functions should not mix with normal Functions.
            Object.keys(this.agentMap).forEach( (v) => {
                let ins = this.agentMap[v];
                ins.functions[name] = config;
            });

        } else {
            let result = this.TryApplyFunction(name, classObject, config);
            if (!result) this.delayApply.push( [name, classObject, config] );
        }
    }

    private static TryApplyFunction(name: string, classObject: any, config: IAgentTaskFunction): boolean {
        let ins = this.getAgentTaskDescriptorByClassObject(classObject);
        if (!ins) return false;
        ins.functions[name] = config;
        return true;
    }

    private static DelayApplyFunction() {
        let applied = [];
        for (let i=0; i<this.delayApply.length; ++i) {
            let [ name, classObject, config ] = this.delayApply[i];
            let result = this.TryApplyFunction(name, classObject, config);
            if (result) applied.push(i);
        }
        for (let i=applied.length-1; i>=0; --i) {
            let key = applied[i];
            this.delayApply.splice(key, 1);
        }
    }

    public static getAgentTaskDescriptorByName(name: string): IAgentTaskDescriptor {
        return this.agentMap[name];
    }
    public static getAgentTaskDescriptorByClassObject(classObject: any): IAgentTaskDescriptor {
        return Object.keys(this.agentMap).reduce<IAgentTaskDescriptor>( (final, key) => {
            let ins = this.agentMap[key];
            return ins.classObject === classObject || classObject.isPrototypeOf(ins.classObject) ? ins : final;
        }, null);
    }
    public static getAgentTaskDescriptorByInstance(instance: any): IAgentTaskDescriptor {
        return Object.keys(this.agentMap).reduce<IAgentTaskDescriptor>( (final, key) => {
            let ins = this.agentMap[key];
            return instance instanceof ins.classObject ? ins : final;
        }, null);
    }
    public static getAllAgentTaskDescriptors(): AgentTaskMapType {
        return { ...this.agentMap };
    }
    
}