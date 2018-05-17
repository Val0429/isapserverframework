/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Array<[number, string, string] | [number, string]> = [
    [1, "Login", `
        /// owner: self User
        /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    `],
    [2, "Logout", `
        /// owner: self User
        /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    `],

    /// 3000 for Visitor ///////////////////////
    /// 3100 - Registration
    [3101, "PickFloor"],
    [3102, "ScanIDCard"],
    [3188, "RegistrationComplete"],

    /// 3200 - Check In
    [3201, "VerifyOTPCode"],
    [3202, "FaceVerify"],
    [3288, "CheckInComplete"],
    ////////////////////////////////////////////
];

export default events;