/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

import { Observable } from "rxjs";
import { Register, Base } from './../core';
const jsonata = require('jsonata');

interface IFilterJSONata {
    ata: string;
}

@Register({
    name: "FilterJSONata",
    description: "Filter object with JSONata.",
    inputType: "IFilterJSONata"
})
export class FilterJSONata extends Base<IFilterJSONata> {
    private expression;
    constructor(config) {
        super(config);
        this.expression = jsonata(config.ata);
    }
    public get(source: Observable<any>): Observable<any> {
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

declare module "models/agents/libs/utilities/filters/core" {
    export interface IAgentTaskFilterMapping {
        FilterJSONata: IFilterJSONata;
    }    
}
