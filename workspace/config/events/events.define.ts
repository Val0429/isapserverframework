import { Config } from './../../../models/events/events.define';

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Config[] = [
    /// 3000 for Visitor ///////////////////////
    /// 3600 - Register
    [3601, "PickFloor", `
        /**
         * Floors object pick by Person.
         */
        floor: Floors;
    `, ["Floors"]],
    [3602, "ScanIDCard"],
    [3688, "RegistrationComplete"],

    /// 3700 - Check In
    [3701, "TryCheckIn"],
    [3702, "FaceVerifyResult"],
    [3788, "DoneCheckIn"],
    ////////////////////////////////////////////
];

export default events;
