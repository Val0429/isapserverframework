import { ExtractScheduleActionBaseI, ExtractScheduleActionBaseO, ScheduleActionBase } from './../actions/core';
import { ExtractScheduleTemplateBaseI, ExtractScheduleTemplateBaseO, ScheduleTemplateBase } from './../templates/core';
import { ObjectDiff } from 'helpers/parse-server/parse-helper';

export type IOutputScheduleControllerRegisterAction<Action, Template> =
    ObjectDiff< ExtractScheduleActionBaseI<Action>, ExtractScheduleTemplateBaseO<Template> >;

export type MaybePromise<T> = Promise<T> | T;
export type TRegisterTemplateCallback<EventType, Template, Action> = ( event: EventType, data: any ) => MaybePromise<ExtractScheduleTemplateBaseI<Template>>;
export type TRegisterActionCallback<EventType, Template, Action> = (event: EventType, data: any) => MaybePromise<IOutputScheduleControllerRegisterAction<Action, Template>>;

export interface ClassConstructor<T> {
    new(): T
}

export class ScheduleControllerBase<
    EventType,
    Action extends ScheduleActionBase<any, any>,
    Template extends ScheduleTemplateBase<any, any>,
    TypeOfAction = ClassConstructor<Action>,
    TypeOfTemplate = ClassConstructor<Template>
    > {

    private callbackTemplate: TRegisterTemplateCallback<EventType, Template, Action>;
    private callbackAction: TRegisterActionCallback<EventType, Template, Action>;
    private template: TypeOfTemplate;
    private action: TypeOfAction;

    constructor(action: TypeOfAction, template: TypeOfTemplate) {
        this.action = action;
        this.template = template;
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
