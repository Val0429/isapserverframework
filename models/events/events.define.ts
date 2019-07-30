/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Config[] = [
    ["1", "Login", `
        /**
         * owner: self User
         */
        owner: Parse.User;
        /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
        target?: Parse.User;
    `],
    ["2", "Logout", `
        /// owner: self User
        /// target: Administrator / Host / Kiosk = none. Visitor = Target Kiosk
    `],
];

export default events;

export type Config = [string, string, string, string[]] | [string, string, string] | [string, string];