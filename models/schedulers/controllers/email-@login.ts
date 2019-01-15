import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';

import { ScheduleControllerBase } from './../controllers/core';
import { ScheduleActionEmail } from './../actions/email';
import { ScheduleTemplateEmail_PreRegistrationExample } from './../templates/email';

import pinCode from 'services/pin-code';


/// just an example
@DynamicLoader.set("ScheduleController.Email.LoginExample")
export class ScheduleControllerEmail_LoginExample extends ScheduleControllerBase<
    EventLogin,
    ScheduleActionEmail,
    ScheduleTemplateEmail_PreRegistrationExample
    > {
    
    constructor() {
        super(ScheduleActionEmail, ScheduleTemplateEmail_PreRegistrationExample);

        this.registerTemplate( async (event, data) => {
            return {
                company: {
                    name: "iSap"
                },
                pinCode: await pinCode.next(),
                linkPreRegistrationPage: "http",
                visitor: {
                    name: "Val Liu",
                    email: "val.liu@isapsolution.com",
                    phone: "0928240310",
                    purposeOfVisit: "Visit"
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
