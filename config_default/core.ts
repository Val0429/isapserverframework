/*
 * Created on Tue Jul 30 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

var config: Config = {
    enable: true,
    port: 8080,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: "",
    publicExternalIP: "localhost",
    sessionExpireSeconds: 3600,

    httpsEnabled: false,
    httpDisabled: false,
    httpsPort: 4443
};
export default config;

export interface Config {
    /**
     * If false, disable all http / https port.
     */
    enable?: boolean;
    /**
     * Server port.
     */
    port: number;
    /**
     * Globally disable cache?
     */
    disableCache: boolean;
    accessControlAllowOrigin: boolean;
    /**
     * Sub path of cgi? ex: /api
     * default: null
     */
    cgiPath: string;
    publicExternalIP: string;
    sessionExpireSeconds: number;

    /**
     * https enabled.
     */
    httpsEnabled: boolean;
    httpDisabled: boolean;
    httpsPort: number;
}