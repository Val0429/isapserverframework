import { shellWriter2 } from 'helpers/shells/shell-writer';

var tELicenseProductId = `
export enum ELicenseProductId {
    {0}
}
`;

var tELicenseProductName = `
export enum ELicenseProductName {
    {0}
}
`;

import { Config } from 'models/define/licenses/product-id';
function main(events: Config[]): string {
    var tmpstr = [];

    var tmp = [];
    for (let i: number = 0; i < events.length; i++) {
        let event = events[i];

        tmp.push(`"${event[0]}" = ${i + 1}`);
    }
    tmpstr.push(tELicenseProductId.replace('{0}', tmp.join(',\r\n    ')));

    var tmp = [];
    for (let i: number = 0; i < events.length; i++) {
        let event = events[i];

        tmp.push(`"${event[1]}" = ${i + 1}`);
    }
    tmpstr.push(tELicenseProductName.replace('{0}', tmp.join(',\r\n    ')));

    return tmpstr.join('\r\n');
}

const genFilePath = `${__dirname}/../core/licenses.gen.ts`;
const tmplPath = `${__dirname}/licenses.shell.ts`;
const customDefPath = `${__dirname}/../workspace/define/licenses/product-id.define.ts`;

// var events = require(defPath).default;
var cevents = require(customDefPath).default;
import * as fs from 'fs';
import { PrintService } from 'helpers';

shellWriter2(genFilePath, main([...cevents]), () => {
    PrintService.log('License file updated.', undefined, 'info');
});
