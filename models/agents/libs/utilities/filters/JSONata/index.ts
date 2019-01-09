import { Observable } from "rxjs";
import { Base } from "../core";
import { Register } from './../core';
const jsonata = require('jsonata');

interface IFilterJSONata {
    ata: string;
}

@Register({
    name: "FilterJSONata",
    description: "Filter object with JSONata.",
    inputType: "string"
})
export class FilterJSONata extends Base<IFilterJSONata, string, any> {
    private expression;
    constructor(config) {
        super(config);
        this.expression = jsonata(config.ata);
    }
    public get(source: Observable<string>): Observable<any> {
        return new Observable<any>(observer => {
            let count = 0;
            return source.subscribe( (data) => {
                let result = this.expression.evaluate(data);
                if (
                    result === null || result === undefined
                    // || ( Array.isArray(result) && result.length === 0 )
                    // || ( typeof result === "object" && Object.keys(result).length === 0 )
                ) {
                    return;
                }
                observer.next(result);

            }, e => observer.error(e), () => observer.complete());
          });
    }
}