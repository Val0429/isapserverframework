import { shellWriter, autoPad } from './../helpers/shells/shell-writer';

const genFilePath = `${__dirname}/../core/config.gen.ts`;
const tmplPath = `${__dirname}/config.shell.ts`;
const defPath = `${__dirname}/../workspace/config/core/core.define.ts`;

import * as fs from 'fs';

shellWriter(
    [defPath, tmplPath],
    genFilePath,
    () => {
        fs.writeFileSync(genFilePath,
            fs.readFileSync(defPath),
            "UTF-8");
        console.log("<Generated> Config file updated!");        
    }
);