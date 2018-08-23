import { shellWriter2 } from 'helpers/shells/shell-writer';
import { Config } from 'core/config.gen';

var tHeader = `
"use strict";

import 'shells/events.shell';

import * as express from 'express';
import { expressWsRoutes } from 'helpers/middlewares/express-ws-routes';
import * as fs from 'fs';
import { noCache } from 'helpers/middlewares/no-cache';
import { accessControlAllowOrigin } from 'helpers/middlewares/access-control-allow-origin';
import { routerLoader } from 'helpers/routers/router-loader';
import { makeServerReady } from 'core/pending-tasks';
import * as parse from 'parse-server';
import * as ParseDashboard from 'parse-dashboard';
import { MongoClient, Collection, IndexOptions, Db } from 'mongodb';
import { sharedMongoDB } from 'helpers/parse-server/parse-helper';

import { Config } from 'core/config.gen';

let app: express.Application = expressWsRoutes();
`;

var tDebugStack = `
var lj = require('longjohn');
lj.async_trace_limit = 20;
// process.on('uncaughtException', err => {
// });
`;

var tDisableCache = `
/// Disable Cache
if (Config.core.disableCache) app.use(noCache);
`;

var tAccessControlAllowOrigin = `
/// Allow Origin Access
if (Config.core.accessControlAllowOrigin) app.use(<any>accessControlAllowOrigin);
`;

var tLoadRouter = `
/// Load Routers!
var actions = routerLoader(app, \`\${__dirname}/../workspace/cgi-bin\`, Config.core.cgiPath);
`;

var tRunParseServer = `
if (Config.mongodb.enable) {
    /// run parse server ////
    var ParseServer = new parse.ParseServer({
        databaseURI: \`mongodb://\${Config.mongodb.ip}:\${Config.mongodb.port}/\${Config.mongodb.collection}\`,
        appId: Config.parseServer.appId,
        masterKey: Config.parseServer.masterKey,
        fileKey: Config.parseServer.fileKey,
        serverURL: \`http://localhost:\${Config.core.port}\${Config.parseServer.serverPath}\`,
    });
    app.use(Config.parseServer.serverPath, ParseServer);
}
/////////////////////////
`;

var tRunParseDashboard = `
/// run parse dashboard ////
if (Config.mongodb.enable && Config.parseDashboard.enable) {
var Dashboard = new ParseDashboard({
    "apps": [
    {
        "serverURL": \`http://localhost:\${Config.core.port}\${Config.parseServer.serverPath}\`,
        "appId": Config.parseServer.appId,
        "masterKey": Config.parseServer.masterKey,
        "appName": Config.parseDashboard.appName
    }
    ]
});
app.use(Config.parseDashboard.serverPath, Dashboard);
}
////////////////////////////
`;

var tRunWeb = `
app.use('/', express.static(\`\${__dirname}/../workspace/custom/web\`));
`;

var tFinalizeError = `
import { Errors } from 'core/errors.gen';
app.use( (reason, req, res, next) => {
    if (reason instanceof Errors) reason.resolve(res);
    else {
        Errors.throw(Errors.Custom, [reason.toString()]).resolve(res);
    }
});
`;

var tRunServer = `
app.listen(Config.core.port, async () => {
    console.log(\`Server running at port \${Config.core.port}.\`);

    /// todo: this is a workaround. create database at the beginning.
    let { ip, port, collection } = Config.mongodb;
    let db = await sharedMongoDB();
    await db.createCollection("_SCHEMA");
    ////////////////////////////////////////////////////////////////

    makeServerReady();
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

    /// debug track /////////////////////////////
    tmpstr.push(tDebugStack);
    /////////////////////////////////////////////

    /// disable cache ///////////////////////////
    tmpstr.push(tDisableCache);
    /////////////////////////////////////////////

    /// access control //////////////////////////
    tmpstr.push(tAccessControlAllowOrigin);
    /////////////////////////////////////////////

    /// load router /////////////////////////////
    tmpstr.push(tLoadRouter);
    /////////////////////////////////////////////

    /// run parse server ////////////////////////
    tmpstr.push(tRunParseServer);
    /////////////////////////////////////////////

    /// run parse dashboard /////////////////////
    if (Config.parseDashboard.enable) tmpstr.push(tRunParseDashboard);
    /////////////////////////////////////////////

    /// run web /////////////////////////////////
    tmpstr.push(tRunWeb);
    /////////////////////////////////////////////

    /// finalize error //////////////////////////
    tmpstr.push(tFinalizeError);
    /////////////////////////////////////////////

    /// run server //////////////////////////////
    tmpstr.push(tRunServer);
    /////////////////////////////////////////////

    /// concat
    return tmpstr.join("\r\n");
}


const genFilePath = `${__dirname}/../core/main.gen.ts`;
const tmplPath = `${__dirname}/server.shell.ts`;

import * as fs from 'fs';

shellWriter2(
    genFilePath,
    main(),
    () => {
        console.log("<Generated> Server file updated!");
    }
);