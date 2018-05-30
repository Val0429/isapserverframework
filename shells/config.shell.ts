import { shellWriter, autoPad } from './../helpers/shells/shell-writer';
import * as fs from 'fs';
import * as p from 'path';

// import coreConfig, { Config as coreConfigType } from './../config_default/core';
// import mongodbConfig, { Config as mongodbConfigType } from './../config_default/mongodb';
var tHeaderSpecial = `
{0}
`;

// interface Config {
//     core: coreConfigType;
//     mongodb: mongodbConfigType;
// }
var tInterface = `
interface Config {
{0}
}
`;

// core: coreConfig,
// mongodb: mongodbConfig,
var tExport = `
var Config: Config = {
{0}
}

export { Config };
`;


const genFilePath = `${__dirname}/../core/config.gen.ts`;
const tmplPath = `${__dirname}/config.shell.ts`;
const defPath = `${__dirname}/../config_default`;
const customDefPath = `${__dirname}/../workspace/config/custom`;

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
    var template = `import {0}Config, { Config as {0}ConfigType } from './../workspace/config/default/{1}';`;
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
    var template = `import {0}Config, { Config as {0}ConfigType } from './../workspace/config/custom/{1}';`;
    var dir = customDefPath;
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
            template.replace(/\{0\}/g, capitalize(key))
        );
    }
    tmpstr.push(
        tInterface.replace("{0}", tmp.join("\r\n"))
    )
    /////////////////////////////////////////////

    /// make export /////////////////////////////
    var tmp = [];
    var template = `{0}: <any>{0}Config,`;
    for (var key of keys) {
        tmp.push(
            template.replace(/\{0\}/g, capitalize(key))
        );
    }
    tmpstr.push(
        tExport.replace("{0}", tmp.join("\r\n"))
    )
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}

function exec() {
    var origin = fs.existsSync(genFilePath) ? fs.readFileSync(genFilePath, "UTF-8") : "";
    var data = main();
    if (origin !== data) {
        fs.writeFileSync(genFilePath, data, "UTF-8");
        console.log("<Generated> Config file updated!");            
    }
}

export { exec };