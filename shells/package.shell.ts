import { shellWriter2, autoPad } from 'helpers/shells/shell-writer';


function main(): string {
    var origin = require(genFilePath);
    var target = require(tmplPath);

    var result = JSON.stringify({
        ...origin,
        name: target.name,
        version: target.version,
        config: target.config,
        description: target.description,        
    }, null, 2);

    return result;
}


const genFilePath = `${__dirname}/../package.json`;
const tmplPath = `${__dirname}/../workspace/package.json`;
import { Log } from 'helpers/utility';

shellWriter2(
    genFilePath,
    main(),
    () => {
        Log.Info("Code Generator", "Package file updated!");
    }
);

