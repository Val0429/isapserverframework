import config from './../config/core/core.define';
import { shellWriter } from './../helpers/shells/shell-writer';

var tHeader = `
/// <reference path="./../typings/index.d.ts" />
"use strict";

import './../shells/events.shell';

import * as express from 'express';
import * as expressWs from 'express-ws';
import * as fs from 'fs';
import config from './../config/core/core.define';

let app: express.Server = express();
/// Enable WebSocket support
let wsapp = expressWs(app);
`;

var tDisableCache = `
/// Disable Cache
import noCacheModule from './../helpers/middlewares/no-cache';
if (config.server.disableCache) app.use(noCacheModule);
`;

var tLoadRouter = `
/// Load Routers!
import { routerLoader } from './../helpers/routers/router-loader';
routerLoader(app, \`\${__dirname}/../cgi-bin\`);
`;

var tRunParseServer = `
/// run parse server ////
import * as parse from 'parse-server';
var ParseServer = new parse.ParseServer({
    databaseURI: \`mongodb://\${config.mongodb.ip}:\${config.mongodb.port}/\${config.parseServer.collection}\`,
    appId: config.parseServer.appId,
    masterKey: config.parseServer.masterKey,
    fileKey: config.parseServer.fileKey,
    serverURL: \`http://localhost:\${config.server.port}\${config.parseServer.serverPath}\`,
});
app.use(config.parseServer.serverPath, ParseServer);
/////////////////////////
`;

var tRunParseDashboard = `
/// run parse dashboard ////
import * as ParseDashboard from 'parse-dashboard';
if (config.parseDashboard.enable) {
  var Dashboard = new ParseDashboard({
    "apps": [
      {
        "serverURL": \`http://localhost:\${config.server.port}\${config.parseDashboard.serverPath}\`,
        "appId": config.parseServer.appId,
        "masterKey": config.parseServer.masterKey,
        "appName": config.parseDashboard.appName
      }
    ]
  });
  app.use('/dashboard', Dashboard);
}
////////////////////////////
`;

var tRunServer = `
app.listen(config.server.port, () => {
    console.log(\`Server running at port \${config.server.port}.\`);
});

export {
  app
}
`;

function autoPad(input: string, value: number) {
    return input.replace(
        new RegExp(`^ {${value},}`, "gm"),
        Array(value+1).join(" ")
    );
}

function main(): string {
    var tmpstr = [];
    
    /// make header /////////////////////////////
    tmpstr.push(
        tHeader.replace(/^[\r\n]+/, '')
    );
    /////////////////////////////////////////////

    /// disable cache ///////////////////////////
    if (config.server.disableCache) tmpstr.push(tDisableCache);
    /////////////////////////////////////////////

    /// load router /////////////////////////////
    tmpstr.push(tLoadRouter);
    /////////////////////////////////////////////

    /// run parse server ////////////////////////
    tmpstr.push(tRunParseServer);
    /////////////////////////////////////////////

    /// run parse dashboard /////////////////////
    if (config.parseDashboard.enable) tmpstr.push(tRunParseDashboard);
    /////////////////////////////////////////////
    
    /// run server //////////////////////////////
    if (config.parseDashboard.enable) tmpstr.push(tRunServer);
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/main.gen.ts`;
const tmplPath = `${__dirname}/server.shell.ts`;

import * as fs from 'fs';

shellWriter(
    [tmplPath],
    genFilePath,
    () => {
        fs.writeFileSync(genFilePath, main(), "UTF-8");
        console.log("<Generated> Server file updated!");        
    }
);