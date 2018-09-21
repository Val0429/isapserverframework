import { ExtractScheduleActionBaseIT, ExtractScheduleActionBaseIC, ExtractScheduleActionBaseO, ScheduleActionBase } from './../actions/core';
import { ExtractScheduleTemplateBaseI, ExtractScheduleTemplateBaseO, ScheduleTemplateBase } from './../templates/core';
import { ObjectDiff } from 'helpers/parse-server/parse-helper';

export type IOutputScheduleControllerRegisterAction<Action, Template> = ExtractScheduleActionBaseIC<Action>;

export type MaybePromise<T> = Promise<T> | T;
export type TRegisterTemplateCallback<EventType, Template, Action> = ( event: EventType, data: any ) => MaybePromise<ExtractScheduleTemplateBaseI<Template>>;
export type TRegisterActionCallback<EventType, Template, Action> = (event: EventType, data: any) => MaybePromise<IOutputScheduleControllerRegisterAction<Action, Template>>;
export type TRegisterShouldExecuteCallback<EventType, Template, Action> = ( event: EventType, data: any ) => MaybePromise<ExtractScheduleActionBaseO<Action> | boolean>;

export interface ClassConstructor<T> {
    new(): T
}

export class ScheduleControllerBase<
    EventType,
    Action extends ScheduleActionBase<any, any, any>,
    Template extends ScheduleTemplateBase<any, any>,
    TypeOfAction = ClassConstructor<Action>,
    TypeOfTemplate = ClassConstructor<Template>
    > {

    private callbackTemplate: TRegisterTemplateCallback<EventType, Template, Action>;
    private callbackAction: TRegisterActionCallback<EventType, Template, Action>;
    private callbackShouldExecute: TRegisterShouldExecuteCallback<EventType, Template, Action>;

    private template: TypeOfTemplate;
    private action: TypeOfAction;

    constructor(action: TypeOfAction, template: TypeOfTemplate) {
        this.action = action;
        this.template = template;
    }

    /**
     * Execute or not. true to continue.
     */
    registerShouldExecute( callback: TRegisterShouldExecuteCallback<EventType, Template, Action> ) {
        this.callbackShouldExecute = callback;
    }

    /**
     * Translate event / data, into template input.
     */
    registerTemplate( callback: TRegisterTemplateCallback<EventType, Template, Action> ) {
        this.callbackTemplate = callback;
    }

    /**
     * Translate event / data, into action input.
     */
    registerAction( callback: TRegisterActionCallback<EventType, Template, Action> ) {
        this.callbackAction = callback;
    }

    async do(event: EventType, data: any = null): Promise<ExtractScheduleActionBaseO<Action>> {
        if (!this.callbackTemplate) throw "<ScheduleControllerBase> must call registerTemplate.";
        if (!this.callbackAction) throw "<ScheduleControllerBase> must call registerAction";
        /// 0) should execute?
        if (this.callbackShouldExecute) {
            let result = await this.callbackShouldExecute(event, data);
            if (result !== true) return result as ExtractScheduleActionBaseO<Action>;
        }

        /// 1) calculate template
        let templateInput = await this.callbackTemplate(event, data);
        let template: Template = new (this.template as any)();
        let templateOutput = await template.do(templateInput);

        /// 2) calculate action
        let actionInput = await this.callbackAction(event, data);
        let action: Action = new (this.action as any)();
        let actionOutput = await action.do({ ...templateOutput, ...(actionInput as any) });

        return actionOutput;
    }
}
