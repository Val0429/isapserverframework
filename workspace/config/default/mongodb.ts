
import { Config } from './../../../config_default/mongodb';

var config: Partial<Config> = {
    collection: "FTS",
    ip: "localhost",
    port: 27017
};
export default config;
export { Config };