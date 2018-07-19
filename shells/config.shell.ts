import { autoPad } from 'helpers/shells/shell-writer';
import * as fs from 'fs';
import * as p from 'path';

// import coreConfig, { Config as coreConfigType } from 'config_default/core';
// import mongodbConfig, { Config as mongodbConfigType } from 'config_default/mongodb';
var tHeaderSpecial = `
{0}
`;

// interface Config {
//     core: coreConfigType;
//     mongodb: mongodbConfigType;
// }
var tInterface = `
interface IConfig {
{0}
}
export { IConfig };
`;

var tInterfaceSetup = `
interface IConfigSetup {
{0}
}
export { IConfigSetup };
`;

// core: coreConfig,
// mongodb: mongodbConfig,
var tExport = `
var Config: IConfig = {
{0}
}

export { Config };
`;


const genFilePath = `${__dirname}/../core/config.gen.ts`;
const tmplPath = `${__dirname}/config.shell.ts`;
const defPath = `${__dirname}/../config_default`;
const wsDefPath = `${__dirname}/../workspace/config/default`;
const wsCustomPath = `${__dirname}/../workspace/config/custom`;

export { wsDefPath, wsCustomPath };

function capitalize(str: string) {
    var regex = /(\-[^-]+)/g;
    return str.replace(regex, (a, b) => {
        return a[1].toUpperCase() + a.substring(2, a.length);
    });
}

function main(): string {
    var tmpstr = [];

    var keys = [];  
    /// make header special /////////////////////
    var tmp = [];
    var template = `import {0}Config, { Config as {0}ConfigType } from 'workspace/config/default/{1}';`;
    var dir = defPath;
    var files = fs.readdirSync(dir);
    for (var file of files) {
        var name = p.parse(file).name;
        keys.push(name);
        tmp.push(
            template.replace(/\{0\}/g, capitalize(name))
                    .replace(/\{1\}/g, name)
        );
    }
    var template = `import {0}Config, { Config as {0}ConfigType } from 'workspace/config/custom/{1}';`;
    var dir = wsCustomPath;
    var files = fs.readdirSync(dir);
    for (var file of files) {
        var name = p.parse(file).name;
        keys.push(name);
        tmp.push(
            template.replace(/\{0\}/g, capitalize(name))
                    .replace(/\{1\}/g, name)
        );
    }
    tmpstr.push(
        tHeaderSpecial.replace(/^[\r\n]+/, '')
                      .replace("{0}", tmp.join("\r\n"))
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    var template = `{0}: {0}ConfigType;`;
    for (var key of keys) {
        tmp.push(
            autoPad(template.replace(/\{0\}/g, capitalize(key)), 4)
        );
    }
    tmpstr.push(
        tInterface.replace("{0}", tmp.join("\r\n"))
    )
    /////////////////////////////////////////////

    /// make interface setup ////////////////////
    var tmp = [];
    var template = `{0}?: Partial<{0}ConfigType>;`;
    for (var key of keys) {
        tmp.push(
            autoPad(template.replace(/\{0\}/g, capitalize(key)), 4)
        );
    }
    tmpstr.push(
        tInterfaceSetup.replace("{0}", tmp.join("\r\n"))
    )
    /////////////////////////////////////////////


    /// make export /////////////////////////////
    var tmp = [];
    var template = `{0}: <any>{0}Config,`;
    for (var key of keys) {
        tmp.push(
            autoPad(template.replace(/\{0\}/g, capitalize(key)), 4)
        );
    }
    tmpstr.push(
        tExport.replace("{0}", tmp.join("\r\n"))
    )
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


var result = {};
var template = `
import { Config } from 'config_default/{0}';
export { Config };

var config: Partial<Config> = {};
export default config;
`;
/// 1) create into workspace default, if not exists.
var files = fs.readdirSync(defPath);
for (var file of files) {
    var target = `${wsDefPath}/${file}`;
    if (!fs.existsSync(target)) {
        var name = p.parse(file).name;
        var content = template.replace("{0}", name);
        fs.writeFileSync(target, content, "UTF-8");
        console.log(`Workspace ${file} not exists, default created.`);
    }
}
/// 2) Try update config.gen
var origin = fs.existsSync(genFilePath) ? fs.readFileSync(genFilePath, "UTF-8") : "";
var data = main();
if (origin !== data) {
    fs.writeFileSync(genFilePath, data, "UTF-8");
    console.log("<Generated> Config file updated!");            
}

/// 3) merge configs
var loadConfig = (dir, file) => {
    var name = p.parse(file).name;
    var path = `${dir}/${file}`;
    var config = require(path).default;
    var stats = fs.statSync(path);
    return { name, config, stats };
}
/// 3.1) load default path
var dir = defPath;
var files = fs.readdirSync(dir);
for (var file of files) {
    var { name, config } = loadConfig(dir, file);
    result[name] = config;
}
/// 3.2) load workspace paths
var dirs = [wsDefPath, wsCustomPath];
for (var dir of dirs) {
    var files = fs.readdirSync(dir);
    for (var file of files) {
        var { name, config, stats } = loadConfig(dir, file);
        result[name] = { ...(result[name] || {}), ...config };

        /// 2.4) update back to target
        for (var key in result[name]) {
            var value = result[name][key];
            config[key] = value;
        }
    }
}