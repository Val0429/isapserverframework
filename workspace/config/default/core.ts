
import { Config } from './../../../config_default/core';

var config: Partial<Config> = {
    port: 6060,
    disableCache: true,
    keyOfSessionId: "sessionId"
};
export default config;
export { Config };