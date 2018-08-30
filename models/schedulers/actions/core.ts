export type ExtractScheduleActionBaseI<T> = T extends ScheduleActionBase<infer U, infer V> ? U : never;
export type ExtractScheduleActionBaseO<T> = T extends ScheduleActionBase<infer U, infer V> ? V : never;

export class ScheduleActionBase<I, O> {
    private callback: (input: I) => Promise<O> | O;

    register( callback: (input: I) => Promise<O> | O ) {
        this.callback = callback;
    }

    do(input: I): Promise<O> | O {
        if (this.callback) return this.callback(input);
        throw "<ScheduleActionBase> should call register.";
    }
}
