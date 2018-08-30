import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';

import { ScheduleTemplateEmail_PreRegistration, IInputScheduleTemplateEmail_PreRegistration, IOutputScheduleTemplateEmail } from './../templates/email';
import { IInputScheduleActionEmail, ScheduleActionEmail } from './../actions/email';
import { ScheduleControllerBase } from './core';


/// just an example
@DynamicLoader.set("ScheduleController.Email.Login")
export class ScheduleControllerEmail_Login extends ScheduleControllerBase<
    EventLogin,
    ScheduleTemplateEmail_PreRegistration,
    ScheduleActionEmail
    > {
    
    constructor() {
        super(ScheduleTemplateEmail_PreRegistration, ScheduleActionEmail);

        this.registerTemplate( async (event, data) => {
            return {
                company: {
                    name: "iSap"
                },
                pinCode: "123",
                linkPreRegistrationPage: "http",
                visitor: {
                    name: event.getValue("owner").getUsername(),
                    email: event.getValue("owner").getEmail(),
                    phone: event.getValue("owner").getUsername(),
                    purposeOfVisit: "0"
                }
            }
        });

        this.registerAction( (event, data) => {
            return {
                to: ["val.liu@isapsolution.com"]
            }
        });
    }
}
