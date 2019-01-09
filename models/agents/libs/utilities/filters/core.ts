import { Observable } from "rxjs";

interface IAgentTaskFilterConfig {
    name: string;
    inputType?: string;
    description?: string;
}
type IAgentTaskFilterMap = IAgentTaskFilterConfig & {
    classObject: any;
}

const filterMap: Map<string, IAgentTaskFilterMap> = new Map();
export function Register(config: IAgentTaskFilterConfig) {
    return (classObject) => {
        filterMap[config.name] = {
            ...config,
            classObject
        }
    }
}
export function All() {
    return filterMap;
}

export function Get(name: string): IAgentTaskFilterMap {
    return filterMap[name];
}

export class Base<T, I, O> {
    protected config: T;
    constructor(config: T) {
        this.config = config;
    }
    public get(source: Observable<I>): Observable<O> { throw "Filter.get should be implemented."; }
}
