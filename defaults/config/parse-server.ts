/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var config: Config = {
    appId: "APPLICATIONKEY",
    masterKey: "MASTERKEY",
    fileKey: "FILEKEY",
    serverPath: "/parse",
};
export default config;

export interface Config {
    appId: string;
    masterKey: string;
    fileKey: string;
    /**
     * Parse url exposed by server. ex: /parse
     */
    serverPath: string;
}
