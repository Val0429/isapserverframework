import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase } from './core';

/// email core ////////////////////////////
export interface IOutputScheduleTemplateEmail {
    subject: string;
    body: string;
}
///////////////////////////////////////////





/// email example
export interface IInputScheduleTemplateEmail_PreRegistration {
    company: {
        /// Company name
        name: string;
    },
    visitor: {
        /// Visitor name, email, phone
        name: string;
        email: string;
        phone: string;
        purposeOfVisit: string;
    },
    linkPreRegistrationPage: string;
    pinCode: string;
}

@DynamicLoader.set("ScheduleTemplate.Email.PreRegistration")
export class ScheduleTemplateEmail_PreRegistration extends ScheduleTemplateBase<
    IInputScheduleTemplateEmail_PreRegistration,
    IOutputScheduleTemplateEmail
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor Invitation from ${input.company.name}`;

            let body = `
    Hi ${input.visitor.name},
    ${input.company.name} has sent you an invitation for your ${input.visitor.purposeOfVisit}.
    Kindly complete the registration by following the instructions on this link:
    <a href="${input.linkPreRegistrationPage}">Click here to complete your registration</a> --> Unique Link to Pre-Registration Page
    Take note of your PinCode / QRCode to verify your registration to our Kiosk.

    Your Pincode is: ${input.pinCode}

    For further inquiries contact: ${input.visitor.name} at ${input.visitor.email} / ${input.visitor.phone}
            `;

            return { subject, body };
        });
    }

}
