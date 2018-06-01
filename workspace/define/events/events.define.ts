import { Config } from './../../../models/events/events.define';

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Config[] = [
    /// 100~ for system ////////////////////////
    [101, "ConfigChanged", `
        key: string;
        value: any;
    `],
    ////////////////////////////////////////////

    /// 3000 for Visitor ///////////////////////
    /// 3600 - Register
    [3601, "TryRegister"],
    [3602, "PickFloor", `
        /**
         * Floors object pick by Person.
         */
        floor: Floors;
    `, ["Floors"]],
    [3603, "ScanIDCard", `
        /**
         * Extracted info from ID Card.
         */
        name: string;
        birthdate: string;
        idnumber: string;
        image: Parse.File[];
    `],
    [3688, "RegistrationComplete"],

    /// 3700 - Check In
    [3701, "TryCheckIn"],
    [3702, "FaceVerifyResult", `
        /**
         * Verified face image and final result.
         */
        image: Parse.File;
        result: boolean;
    `],
    [3788, "DoneCheckIn", `
        /**
         * Check-in final result.
         */
        result: boolean;
    `],
    ////////////////////////////////////////////
];

export default events;
