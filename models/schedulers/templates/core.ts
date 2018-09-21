import { ExtractScheduleActionBaseIT } from './../actions/core';

export type ExtractScheduleTemplateBaseI<T> = T extends ScheduleTemplateBase<infer K, infer V, infer U> ? V : never;
export type ExtractScheduleTemplateBaseO<T> = T extends ScheduleTemplateBase<infer K, infer V, infer U> ? U : never;

export class ScheduleTemplateBase<Action, I,
    O = ExtractScheduleActionBaseIT<Action>
> {
    private callback: (input: I) => Promise<O> | O;

    register( callback: (input: I) => Promise<O> | O ) {
        this.callback = callback;
    }

    async do(input: I): Promise<O> {
        if (this.callback) return await this.callback(input);
        throw "<ScheduleTemplateBase> should call register.";
    }
}
