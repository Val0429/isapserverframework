
export type ExtractScheduleTemplateBaseI<T> = T extends ScheduleTemplateBase<infer U, infer V> ? U : never;
export type ExtractScheduleTemplateBaseO<T> = T extends ScheduleTemplateBase<infer U, infer V> ? V : never;

export class ScheduleTemplateBase<I, O> {
    private callback: (input: I) => Promise<O> | O;

    register( callback: (input: I) => Promise<O> | O ) {
        this.callback = callback;
    }

    async do(input: I): Promise<O> {
        if (this.callback) return await this.callback(input);
        throw "<ScheduleTemplateBase> should call register.";
    }
}
