import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
const isWindows = process.platform === "win32";

let args = process.argv.splice(2, process.argv.length);
let custompath: string = undefined;
if (args.length > 2) {
    custompath = args[0];
    args = args.splice(1, args.length);
}
const from = args[0];
const to = args[1];

let packagepath = path.resolve(__dirname, "../");
let packagejsonpath = path.resolve(packagepath, "workspace", "package.json");
let packagejson = require(packagejsonpath);

let cwd = path.resolve(packagepath, custompath || "./");
let gitBashPath = "C:\\Program Files\\Git\\bin\\bash.exe";
let shell: string = isWindows ? (fs.existsSync(gitBashPath) ? gitBashPath : undefined) : undefined;
let result = execSync(`git archive --output=${packagejson.name}.zip HEAD $(git diff --diff-filter=d --name-only ${from} ${to})`, {
    cwd,
    shell
});
