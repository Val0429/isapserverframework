export type ExtractScheduleActionBaseIT<T> = T extends ScheduleActionBase<infer U, infer K, infer V> ? U : never;
export type ExtractScheduleActionBaseIC<T> = T extends ScheduleActionBase<infer U, infer K, infer V> ? K : never;
export type ExtractScheduleActionBaseO<T> = T extends ScheduleActionBase<infer U, infer K, infer V> ? V : never;

export class ScheduleActionBase<IT, IC, O,
    TypeOfInput = IT & IC,
    TypeOfCallback = (input: TypeOfInput) => Promise<O> | O> {
    private callback: (input: TypeOfInput) => Promise<O> | O;

    register( callback: (input: TypeOfInput) => Promise<O> | O ) {
        this.callback = callback;
    }

    do(input: TypeOfInput): Promise<O> | O {
        if (this.callback) return (this.callback as any)(input);
        throw "<ScheduleActionBase> should call register.";
    }

    private _holderIT: IT;
    private _holderIC: IC;
}
