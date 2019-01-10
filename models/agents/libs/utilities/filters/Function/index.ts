import { Observable } from "rxjs";
import { Register, Base } from './../core';

interface IFilterFunction {
    func: string;
}

@Register({
    name: "FilterFunction",
    description: "Filter object with Custom Function.",
    inputType: "IFilterFunction"
})
export class FilterFunction extends Base<IFilterFunction> {
    private func;
    constructor(config) {
        super(config);
        this.func = Function.apply(null, ['value', this.config.func]);
    }
    public get(source: Observable<any>): Observable<any> {
        return new Observable<any>(observer => {
            return source.subscribe( (data) => {
                try {
                    let result = this.func(data);
                    if (result) observer.next(data);
                } catch(e) {
                    observer.error(e);
                }
            }, e => observer.error(e), () => observer.complete());
          });
    }
}

declare module "models/agents/libs/utilities/filters/core" {
    export interface IAgentTaskFilterMapping {
        FilterFunction: IFilterFunction;
    }    
}
