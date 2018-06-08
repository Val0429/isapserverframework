
import { Config } from './../../../config_default/mongodb';

var config: Partial<Config> = {
    ip: "localhost",
    port: 27017,
    collection: "FRS"
};
export default config;
export { Config };