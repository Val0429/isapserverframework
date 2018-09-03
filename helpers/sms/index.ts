var edge = require('edge');

let sms = edge.func({
    assemblyFile: `${__dirname}/lib/sms-dll.dll`,
    typeName: 'sms_dll.Startup',
    methodName: 'Invoke'
});

export interface SMSCommand {
    comPort: string;
    phone: string;
    message: string;
    timeout: number;
}
export async function sendSMS(input: SMSCommand) {
    return await sms(input);
}