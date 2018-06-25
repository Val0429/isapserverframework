
import { Config } from './../../../config_default/core';

var config: Partial<Config> = {
    port: 6060,
    disableCache: true,
    keyOfSessionId: "sessionId",
    accessControlAllowOrigin: true,
    //cgiPath: "/api",
    cgiPath: "",
};
export default config;
export { Config };