/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Array<[number, string, string] | [number, string]> = [
    [3601, "FingerPrintVerify", `
        /// owner: self User
        pass: boolean;
    `],
];

export default events;