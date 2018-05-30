import * as fs from 'fs';
import * as p from 'path';

const defaultPath = `${__dirname}/../../config_default`;
const wsDefaultPath = `${__dirname}/../../workspace/config/default`;
const wsOtherPath = `${__dirname}/../../workspace/config/custom`;

import { registerSubclass, ParseObject } from './../../helpers/parse-server/parse-helper';
import { exec as configWriterExec } from './../../shells/config.shell';

/// Configurations /////////////////////////////////
export interface IConfiguration<T = any> {
    key: string;
    value: T;
}
@registerSubclass() export class Configurations extends ParseObject<IConfiguration> {}
////////////////////////////////////////////////////

var template = `
import { Config } from './../../../config_default/{0}';

var config: Partial<Config> = {
    
};
export default config;
`;

export /*async*/ function configLoader() {
    var result = {};

    /// 1) create into workspace default, if not exists.
    var files = fs.readdirSync(defaultPath);
    for (var file of files) {
        var target = `${wsDefaultPath}/${file}`;
        if (!fs.existsSync(target)) {
            var name = p.parse(file).name;
            var content = template.replace("{0}", name);
            fs.writeFileSync(target, content, "UTF-8");
            console.log(`Workspace ${file} not exists, default created.`);
        }
    }
    configWriterExec();

    /// 2) merge configs
    var loadConfig = (dir, file) => {
        var name = p.parse(file).name;
        var path = `${dir}/${file}`;
        var config = require(path).default;
        var stats = fs.statSync(path);
        return { name, config, stats };
    }
    /// 2.1) load default path
    var dir = defaultPath;
    var files = fs.readdirSync(dir);
    for (var file of files) {
        var { name, config } = loadConfig(dir, file);
        result[name] = config;
    }
    /// 2.2) load workspace paths
    var dirs = [wsDefaultPath, wsOtherPath];
    for (var dir of dirs) {
        var files = fs.readdirSync(dir);
        for (var file of files) {
            var { name, config, stats } = loadConfig(dir, file);
            // /// 2.3) load db
            // var dbconfig = await new Parse.Query(Configurations)
            //     .equalTo("key", name)
            //     .first();
            // if (dbconfig) {
            //     var key = dbconfig.getValue("key");
            //     var value = dbconfig.getValue("value");
            //     var date = dbconfig.updatedAt;
            //     if (date > stats.mtime)
            //         config = { ...config, ...value };
            //     else
            //         config = { ...value, ...config };
            // }
            result[name] = { ...(result[name] || {}), ...config };

            /// 2.4) update back to target
            for (var key in result[name]) {
                var value = result[name][key];
                config[key] = value;
            }
        }
    }

    // /// 3) if db configurations not exists, write
    // var dbtest = await new Parse.Query(Configurations)
    //     .first();
    // if (!dbtest) {
    //     console.log("Configuration database not exists, created.");
    //     for (var key in result) {
    //         var value = result[key];
    //         await new Configurations({
    //             key, value
    //         }).save();
    //     }
    // }
}
