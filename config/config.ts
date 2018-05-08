import * as fs from 'fs';

export default JSON.parse(fs.readFileSync(`${__dirname}/main.config`).toString());