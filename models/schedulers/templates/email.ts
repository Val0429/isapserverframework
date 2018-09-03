/// email core ////////////////////////////
export interface IOutputScheduleTemplateEmail {
    subject: string;
    body: string;
}
///////////////////////////////////////////





/// email example
import { ScheduleTemplateBase } from './core';

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

export class ScheduleTemplateEmail_PreRegistrationExample extends ScheduleTemplateBase<
    IInputScheduleTemplateEmail_PreRegistration,
    IOutputScheduleTemplateEmail
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor Invitation from ${input.company.name}`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.visitor.name},</p>
        <p>${input.company.name} has sent you an invitation for your ${input.visitor.purposeOfVisit}.
        Kindly complete the registration by following the instructions on this link:</p>
        <p><a href="${input.linkPreRegistrationPage}">Click here to complete your registration</a> --> Unique Link to Pre-Registration Page
        Take note of your PinCode / QRCode to verify your registration to our Kiosk.</p>

        <p>Your Pincode is: <b style="font-size: 24">${input.pinCode}</b></p>

        <p>For further inquiries contact: <b>${input.visitor.name}</b> at <a href="mailto://${input.visitor.email}">${input.visitor.email}</a> / ${input.visitor.phone}</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
