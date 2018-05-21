import { shellWriter, autoPad } from './../helpers/shells/shell-writer';

var tHeader = `
import { ErrorObject } from './../models/cgis/errors.base';
export * from './../models/cgis/errors.base';
`;

var tInterface = `
export class Errors {
{0}

    detail: ErrorObject;
    constructor(error: ErrorObject) {
        this.detail = error;
    }

    static throw(error: ErrorObject): Errors {
        return new Errors(error);
    }
}
`;

var tInterfaceUnit = `
    static {0}: ErrorObject = { statusCode: {1}, message: "{2}" };
`;

import { Config } from './../models/cgis/errors.define';
function main(events: Config[]): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+$/, '')
    );
    /////////////////////////////////////////////

    /// make interface //////////////////////////
    var tmp = [];
    for (var event of events) {
        tmp.push(
            tInterfaceUnit
                      .replace(/^[\r\n]+|[\r\n]+$/g, '')
                      .replace(/\{0\}/g, event[0])
                      .replace(/\{1\}/g, event[1].toString())
                      .replace(/\{2\}/g, event[2])
        );
    }
    tmpstr.push(
        tInterface.replace( /\{0\}/g, tmp.join("\r\n") )
    );
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/errors.gen.ts`;
const tmplPath = `${__dirname}/errors.shell.ts`;
const defPath = `${__dirname}/../models/cgis/errors.define.ts`;
const customDefPath = `${__dirname}/../config/cgis/errors.define.ts`;

var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';

shellWriter(
    [defPath, tmplPath, customDefPath],
    genFilePath,
    () => {
        var merged = [...events, ...cevents];
        fs.writeFileSync(genFilePath, main(merged), "UTF-8");
        console.log("<Generated> Error file updated!");        
    }
);